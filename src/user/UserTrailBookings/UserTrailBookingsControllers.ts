import { Request, Response } from "express";

import { prisma } from "../../config/db.js";
export const trialController = async (req: Request, res: Response) => {
  try {
    const { libraryId, slotTimingId, slotTypeId, libraryName, userId } =
      req.body;

    if (!libraryId || !slotTimingId || !slotTypeId || !libraryName || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const library = await prisma.library.findUnique({
      where: { id: libraryId },
      select: {
        trialDuration: true,
        slotTypes: {
          include: {
            slotTimings: true,
          },
        },
      },
    });

    if (!library) {
      return res.status(404).json({ message: "Library not found" });
    }

    if (!library.slotTypes || library.slotTypes.length === 0) {
      throw new Error("No slot types available for this library");
    }

    if (library.slotTypes.includes(slotTypeId)) {
      throw new Error("Invalid slot type selected");
    }

    if (!library.slotTypes.some((st) => st.slotTimings.some((stt) => stt.id === slotTimingId))) {
      throw new Error("Invalid slot timing selected");
    }
    

    const booking = await prisma.trialBooking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        libraryName,
        trialEndDate: new Date(
          Date.now() +
            (library!.trialDuration as number) * 24 * 60 * 60 * 1000,
        ),
        userId,
        status: "ACTIVE",
      },
    });
    return res.json({ message: "Trial booking created", booking });
  } catch (error) {
    res.status(500).json({ message: "Trial booking failed", error:error instanceof Error ? error.message : error });
  }
};

export const getUserTrialBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params as any;
    console.log(userId);

    const bookings = await prisma.trialBooking.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
    console.log(bookings);
    res.status(200).json({
      message:"success",

       bookings
       });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trial bookings", error:error });
  }
};

