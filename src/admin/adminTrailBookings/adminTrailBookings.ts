import { Request, Response } from "express";

import { prisma } from "../../config/db.js";
export const getLibraryTrialBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { libraryId } = req.params as any;
    const bookings = await prisma.trialBooking.findMany({
      where: { libraryId: libraryId as string, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ message: "success", bookings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch library trial bookings", error });
  }
};
