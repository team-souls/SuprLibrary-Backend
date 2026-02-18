import { Request, Response } from "express";
import { Logger } from "../utils/logger.js";
import { prisma } from "../config/db.js";

export const createLibraryWithSlots = async (req: Request, res: Response) => {
  console.log("create librar function called by user")
  try {
    const {
      email,
      name,
      totalSeats,
      basePrice,
      location,
      contactNumber,
      slotTypes,
    } = req.body;
    console.log("Received data:", req.body);
    req.body.slotTypes.forEach(element => {
      console.log(element)
      element.timings.forEach(time => {
        console.log(time)
      });
    });
    

    // const owner = await prisma.user.findUnique({
    //   where: { email },
    //   include: { library: true },
    // });

    // if (!owner) {
    //   return res.status(404).json({ message: "User not found" });
    // }

    // if (owner.role !== "ADMIN") {
    //   return res.status(400).json({
    //     message: "User is not an ADMIN",
    //   });
    // }

    // if (owner.library) {
    //   return res.status(400).json({
    //     message: "Owner already has a library",
    //   });
    // }

    // 2️⃣ Transaction Start
    const result = await prisma.$transaction(async (tx) => {
      // // Create Library
      // const library = await tx.library.create({
      //   data: {
      //     name,
      //     totalSeats: Number(totalSeats),
      //     basePrice: Number(basePrice),
      //     location,
      //     contactNumber,
      //     ownerId: owner.id,
      //   },
      // });

      // // Create SlotTypes + SlotTimings
      // for (const slot of slotTypes) {
      //   const createdSlotType = await tx.slotType.create({
      //     data: {
      //       typeName: slot.typeName,
      //       duration: Number(slot.duration),
      //       price: Number(slot.price),
      //       libraryId: library.id,
      //     },
      //   });

      //   // Create Timings
      //   for (const timing of slot.timings) {
      //     if (!timing.startTime || !timing.endTime) {
      //       throw new Error("Invalid timing format");
      //     }

      //     // Expecting "HH:mm"
      //     const [startHour, startMinute] = timing.startTime
      //       .split(":")
      //       .map(Number);
      //     const [endHour, endMinute] = timing.endTime.split(":").map(Number);

      //     const startDate = new Date();
      //     startDate.setHours(startHour, startMinute, 0, 0);

      //     const endDate = new Date();
      //     endDate.setHours(endHour, endMinute, 0, 0);

      //     // Optional validation: prevent invalid range
      //     if (endDate <= startDate) {
      //       throw new Error("End time must be greater than start time");
      //     }

      //     await tx.slotTiming.create({
      //       data: {
      //         slotTypeId: createdSlotType.id,
      //         startTime: startDate,
      //         endTime: endDate,
      //       },
      //     });
      //   }
      // }

      return ;
    });

    return res.status(201).json({
      message: "Library created successfully",
      library: result,
    });
    return null
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create library",
    });
  }
};

export const getAllLibraries = async (req: Request, res: Response) => {
  try {
    const libraries = await prisma.library.findMany({
      include: {},
    });

    return res.status(200).json(libraries);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch libraries",
    });
  }
};

export const getLibraryByOwnerEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const owner = await prisma.user.findUnique({
      where: { email: email as string },
      include: {
        library: {},
      },
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    if (!owner.library) {
      return res.status(404).json({
        message: "No library found for this owner",
      });
    }

    return res.status(200).json(owner.library);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library",
    });
  }
};
export const getSingleLibrary = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params;

    if (!libraryId) {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const library = await prisma.library.findUnique({
      where: { id: libraryId as string },
    });
    if (!library) {
      return res.status(404).json({
        message: "Library not found",
      });
    }

    return res.status(200).json(library);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library",
    });
  }
};
export const getSingleLibrarySlots = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params;

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

    return res.status(200).json(slots);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch library slots",
    });
  }
};
export const getLibrarySlotsTiming = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params;

    if (!libraryId) {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const slots = await prisma.slotTiming.findMany({
      where: { slotType:{
        libraryId: libraryId as string
      }},
      
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
