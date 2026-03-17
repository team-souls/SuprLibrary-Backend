import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { error } from "node:console";

export const scanAttendance = async (req: Request, res: Response) => {
  const { token, userId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET!) as any;
    const { libraryId } = decoded;

    // get slotTimingId from booking for this user and library
    const booking = await prisma.booking.findFirst({
      where: { userId: userId as string, libraryId: libraryId as string, status: "SUCCESS" },
    });
    console.log("Booking:", booking);
    const trialBooking = await prisma.trialBooking.findFirst({
      where: { userId: userId as string, libraryId: libraryId as string, status: "ACTIVE" },
    });
    
    if (!booking && !trialBooking) {
      return res.status(400).json({ message: "No booking exists for this user and library",  trialBooking });
    }
    console.log("Trial Booking: test code ", trialBooking);
    const slotTimingId = booking?.slotTimingId?.toString() || trialBooking?.slotTimingId?.toString();
    console.log("Slot Timing ID: code test", slotTimingId);
    if (!slotTimingId) {
      return res.status(400).json({ message: "No slot timing found for this booking" });
    }

    const slot = await prisma.slotTiming.findUnique({
      where: { id: slotTimingId },
    });
    console.log("Slot Timing: code test", slot);
    if (!slot) {
      return res.status(400).json({ message: "Invalid slot timing" });
    }

    if (slot.startTime > new Date() || slot.endTime < new Date()) {
      return res.status(400).json({ message: "Not within slot timing" , error: "Slot timing is not valid" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
        date: today,
        checkOutTime: null,
      },
    });

    if (!existing) {
      // CHECK IN
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          libraryId,
          slotTimingId,
          date: today,
          checkInTime: now,
        },
      });
      return res.json({ message: "Checked In", attendance ,error: "No existing attendance record, creating new check-in" });
    } else {
      // CHECK OUT
      const duration = now.getTime() - existing.checkInTime!.getTime();
      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
          durationMinutes: Math.floor(duration / 60000),
        },
      });
      return res.json({ message: "Checked Out", attendance ,error: "Existing attendance record found, updating with check-out time and duration"});
    }
  } catch (err) {
    return res.status(400).json({ message: "Invalid QR" , err});
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const attendances = await prisma.attendance.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
    res.json({ attendances });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance", error });
  }
};

export const getLibraryAttendance = async (req: Request, res: Response) => {
  const { libraryId } = req.params;

  try {
    const attendances = await prisma.attendance.findMany({
      where: { libraryId: libraryId as string },
      orderBy: { createdAt: "desc" },
    });
    res.json({ attendances });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch library attendance", error });
  }
};

export const getSlotAttendance = async (req: Request, res: Response) => {
  const { slotTimingId } = req.params;

    try {
    const attendances = await prisma.attendance.findMany({
      where: { slotTimingId: slotTimingId as string },
      orderBy: { createdAt: "desc" },
    });
    res.json({ attendances });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch slot attendance", error });
  }
};