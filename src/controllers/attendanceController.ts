import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";

export const generateQrToken = async (req: Request, res: Response) => {
  try {
    const { userId, libraryId, slotTimingId } = req.body;

    if (!libraryId || !slotTimingId) {
      return res.status(400).json({
        message: "libraryId and slotTimingId are required",
      });
    }

    const now = new Date();

    // 1️⃣ Check active booking
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
        status: "SUCCESS",
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // 2️⃣ Check active trial booking
    const trialBooking = await prisma.trialBooking.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
        status: "ACTIVE",
        trialEndDate: { gte: now },
      },
    });

    if (!booking && !trialBooking) {
      return res.status(403).json({
        message: "No valid booking or trial found",
      });
    }

    // 3️⃣ Prevent multiple active sessions
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOutTime: null,
      },
    });

    if (activeAttendance) {
      return res.status(400).json({
        message: "User already checked in",
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId,
        libraryId,
        slotTimingId,
      },
      process.env.QR_SECRET!,
      { expiresIn: "3m" }
    );

    return res.status(200).json({
      message: "QR token generated successfully",
      qrToken: token,
      expiresIn: "3 minutes",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const scanAttendance = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET!) as any;

    const { userId, libraryId, slotTimingId } = decoded;

    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
        status: "SUCCESS",
      },
    });

    const trial = await prisma.trialBooking.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
        status: "ACTIVE",
      },
    });

    if (!booking && !trial) {
      return res.status(400).json({ message: "No active booking found" });
    }

    
    if (trial && trial.trialEndDate! < new Date()) {
      await prisma.trialBooking.update({
        where: { id: trial.id },
        data: { status: "EXPIRED" },
      });

      return res.status(400).json({ message: "Trial expired" });
    }

    
    const slot = await prisma.slotTiming.findUnique({
      where: { id: slotTimingId },
    });

    const now = new Date();

    if (now < slot!.startTime || now > slot!.endTime) {
      return res.status(400).json({ message: "Outside slot timing" });
    }

    
    const currentCount = await prisma.attendance.count({
      where: {
        slotTimingId,
        checkOutTime: null,
      },
    });

    if (currentCount >= slot!.activeStudents) {
      return res.status(400).json({ message: "Slot full" });
    }

    
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        libraryId,
        slotTimingId,
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
          checkInTime: now,
        },
      });

      return res.json({ message: "Checked In", attendance });
    } else {
      // CHECK OUT
      const duration =
        now.getTime() - existing.checkInTime!.getTime();

      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
          durationMinutes: Math.floor(duration / 60000),
        },
      });

      return res.json({ message: "Checked Out", attendance });
    }
  } catch (err) {
    return res.status(400).json({ message: "Invalid QR" });
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