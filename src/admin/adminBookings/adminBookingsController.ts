import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
export const getLibraryBookings = async (req:Request, res:Response) => {
  try {
    const { libraryId } = req.params;

    if (!libraryId) {
      return res.status(400).json({
        success: false,
        message: "Library ID is required",
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        libraryId,
        status: "SUCCESS",
      },
      select: {
        id: true,
        amount: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        slotTiming: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching library bookings:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
