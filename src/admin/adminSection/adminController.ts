import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
export const getLibraryIdByOwnerId = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    console.log(ownerId)
    if (!ownerId) {
      return res.status(400).json({
        message: "Owner ID is required",
      });
    }

    const library = await prisma.library.findFirst({
      where: {
        ownerId: ownerId as string,
      },
      select: {
        id: true,
      },
    });

    if (!library) {
      return res.status(404).json({
        message: "No library found for this owner",
      });
    }

    return res.status(200).json({
      message: "success",

      id: library.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library id",
    });
  }
};





export const AdminSingleLibraryWithSlots = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params;
    console.log(`the id of library is ${libraryId}`)
    if (!libraryId) {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const slots = await prisma.slotType.findMany({
      where: { libraryId: libraryId as string },
    });
    if (!slots || slots.length === 0) {
      return res.status(404).json({
        message: "Library slots not found",
      });
    }

    return res.status(200).json({
      message: "success",
     slots
    }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library slots",
    });
  }
};



export const AdminLibrarySlotsTiming = async (req: Request, res: Response) => {
  try {
    const { slot } = req.params;
    console.log(slot)
    if (!slot) {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const slots = await prisma.slotTiming.findMany({
      where: {
        slotTypeId: slot as string,
      },
    });

    if (!slots || slots.length === 0) {
      return res.status(404).json({
        message: "Library slots not found",
      });
    }

    return res.status(200).json(slots);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library slots",
    });
  }
};
