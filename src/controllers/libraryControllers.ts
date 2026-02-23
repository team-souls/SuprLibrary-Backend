import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../config/db.js";
import { uploadToCloudinary } from "../upload/cloudinary.js";
import { Logger } from "../utils/logger.js";

const logger = Logger.getInstance();

export const createLibraryWithSlots = async (req: Request, res: Response) => {

  console.log("create library function called");

  try {
    const {
      email,
      name,
      totalSeats,
      basePrice,
      location,
      contactNumber,
      slotTypes,
      facilities,
      trialDuration,
    } = req.body as any;

    const files = req.files as Express.Multer.File[];

    // Find owner
    const owner = await prisma.user.findUnique({
      where: { email },
    });

    if (!owner) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (owner.role !== "ADMIN") {
      return res.status(400).json({
        message: "User is not ADMIN",
      });
    }

    // Upload Images
    let uploadedImageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {

        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

        const uploadRes = await uploadToCloudinary(base64, "libraries");

        uploadedImageUrls.push(uploadRes.secure_url);
      }
    }

    const result = await prisma.$transaction(async (tx) => {

      // 1️⃣ Create Library
      const library = await tx.library.create({
        data: {

          name,
          totalSeats: Number(totalSeats),
          basePrice: Number(basePrice),
          location,
          contactNumber,
          ownerId: owner.id,
          facilities: facilities || [],
          images: uploadedImageUrls,
          trialDuration: Number(trialDuration),

          token: null // initially empty
        },
      });


      // 2️⃣ Create SlotTypes & Timings

      for (const slot of slotTypes) {

        const createdSlotType = await tx.slotType.create({

          data: {
            typeName: slot.typeName,
            duration: Number(slot.duration),
            price: Number(slot.price),
            libraryId: library.id,
          },

        });

        for (const timing of slot.timings) {

          const [startHour, startMinute] =
            timing.startTime.split(":").map(Number);

          const [endHour, endMinute] =
            timing.endTime.split(":").map(Number);


          const startDate = new Date();
          startDate.setHours(startHour, startMinute, 0, 0);

          const endDate = new Date();
          endDate.setHours(endHour, endMinute, 0, 0);


          if (endDate <= startDate) {
            throw new Error("EndTime must be greater");
          }

          await tx.slotTiming.create({

            data: {

              slotTypeId: createdSlotType.id,
              startTime: startDate,
              endTime: endDate,

            },

          });

        }

      }


      // 3️⃣ Generate QR Token

      const token = jwt.sign(
        {
          libraryId: library.id,
          ownerId: owner.id,
        },
        process.env.QR_SECRET!
      );


      // 4️⃣ Save Token

      await tx.library.update({

        where: {
          id: library.id,
        },

        data: {
          token: token,
        },

      });


      return {
        ...library,
        token,
      };

    });


    return res.status(201).json({

      message: "Library Created + Token Generated",

      library: result,

    });


  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message: "Failed to create library",

      error,

    });

  }

};

export const getAllLibraries = async (req: Request, res: Response) => {
  try {
    console.log("fetch all  libraries is called ");
    const libraries = await prisma.library.findMany({
      include: {},
    });
    console.log(libraries); 
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
    const { slot } = req.params;

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

export const updateLibraryWithSlots = async (req: Request, res: Response) => {
  console.log("update library function called");

  try {
    const { id } = req.params;
    console.log(id);
    console.log(req.headers["content-type"]);

    const {
      email,
      name,
      totalSeats,
      basePrice,
      location,
      contactNumber,
      slotTypes,
      facilities,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    console.log("Received update data:", req.body);

    // ================= CHECK OWNER =================

    // ================= CHECK LIBRARY =================

    const existingLibrary = await prisma.library.findUnique({
      where: { id: id as string },
      include: { slotTypes: true },
    });

    if (!existingLibrary) {
      return res.status(404).json({
        message: "Library not found",
      });
    }

    // ================= IMAGE HANDLING =================

    let uploadedImageUrls: string[] = existingLibrary.images;

    if (files && files.length > 0) {
      uploadedImageUrls = [];

      for (const file of files) {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64",
        )}`;

        const uploadRes = await uploadToCloudinary(base64, "libraries");

        uploadedImageUrls.push(uploadRes.secure_url);
      }
    }

    // ================= TRANSACTION =================

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Update Library Main Fields
      const updatedLibrary = await tx.library.update({
        where: { id: id as string },
        data: {
          name,
          totalSeats: Number(totalSeats),
          basePrice: Number(basePrice),
          location,
          contactNumber,
          facilities: facilities || [],
          images: uploadedImageUrls,
        },
      });

      // 2️⃣ Delete old slotTimings
      await tx.slotTiming.deleteMany({
        where: {
          slotType: {
            libraryId: id as string,
          },
        },
      });

      // 3️⃣ Delete old slotTypes
      await tx.slotType.deleteMany({
        where: { libraryId: id as string },
      });

      // 4️⃣ Recreate slotTypes + timings
      for (const slot of slotTypes) {
        const createdSlotType = await tx.slotType.create({
          data: {
            typeName: slot.typeName,
            duration: Number(slot.duration),
            price: Number(slot.price),
            libraryId: id as string,
          },
        });

        for (const timing of slot.timings) {
          const [startHour, startMinute] = timing.startTime
            .split(":")
            .map(Number);

          const [endHour, endMinute] = timing.endTime.split(":").map(Number);

          const startDate = new Date();
          startDate.setHours(startHour, startMinute, 0, 0);

          const endDate = new Date();
          endDate.setHours(endHour, endMinute, 0, 0);

          if (endDate <= startDate) {
            throw new Error("End time must be greater than start time");
          }

          await tx.slotTiming.create({
            data: {
              slotTypeId: createdSlotType.id,
              startTime: startDate,
              endTime: endDate,
            },
          });
        }
      }

      return updatedLibrary;
    });

    return res.status(200).json({
      message: "Library updated successfully",
      library: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update library",
    });
  }
};

export const getLibraryIdByOwnerId = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

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
