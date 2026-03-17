import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { uploadToCloudinary } from "../../upload/cloudinary.js";
import QRCode from "qrcode";
import dotenv from "dotenv";
dotenv.config();

export const DevelopercreateLibraryWithSlots = async (
  req: Request,
  res: Response,
) => {
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
          location,
          basePrice: Number(basePrice),
          contactNumber,
          totalSeats: Number(totalSeats),
          facilities: Array.isArray(facilities)
            ? facilities
            : JSON.parse(facilities || "[]"),
          images: uploadedImageUrls,
          address: " ",
          trialDuration: Number(trialDuration) || 0,

          owner: {
            connect: {
              id: owner.id, // existing user ID
            },
          },
        },
      });

      // 2️⃣ Create SlotTypes & Timings
      console.log(slotTypes);

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
          const [startHour, startMinute] = timing.startTime
            .split(":")
            .map(Number);

          const [endHour, endMinute] = timing.endTime.split(":").map(Number);

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
        process.env.QR_SECRET!,
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

export const DeveloperLibraryByOwnerEmail = async (
  req: Request,
  res: Response,
) => {
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

export const DeveloperUpdateLibraryWithSlots = async (
  req: Request,
  res: Response,
) => {
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

export const DeveloperLibraryIdByOwnerId = async (
  req: Request,
  res: Response,
) => {
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

export const generateLibraryQRToken = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // 1️⃣ Find owner
    console.log(email);
    const owner = await prisma.user.findUnique({
      where: { email },
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    // 2️⃣ Find library
    const library = await prisma.library.findFirst({
      where: {
        ownerId: owner.id,
      },
    });

    if (!library) {
      return res.status(404).json({
        message: "Library not found",
      });
    }

    // 3️⃣ Generate token
    const token = jwt.sign(
      {
        libraryId: library.id,
        ownerId: owner.id,
      },
      process.env.QR_SECRET!,
    );

    // 4️⃣ Save token
    await prisma.library.update({
      where: {
        id: library.id,
      },
      data: {
        token: token,
      },
    });

    // 5️⃣ Generate QR data
    const qrPayload = JSON.stringify({
      token: token,
    });

    const qrImage = await QRCode.toDataURL(qrPayload);
    console.log(qrImage);
    return res.status(200).json({
      message: "QR generated successfully",
      libraryId: library.id,
      token,
      qr: qrImage,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to generate QR",
    });
  }
};

export const verifyLibraryQR = async (req: Request, res: Response) => {
  try {
    console.log("Request Body:", req.body);

    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: "QR data required",
      });
    }

    const parsedQR = JSON.parse(qrData);

    const { token } = parsedQR;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token missing",
      });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.QR_SECRET!);
      console.log("Decoded Token:", decoded);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid QR token",
      });
    }

    const { libraryId, ownerId } = decoded;

    console.log(`Library ID: ${libraryId}`);

    const library = await prisma.library.findUnique({
      where: { id: libraryId },
    });

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Library not found",
      });
    }

    if (library.token !== token) {
      return res.status(401).json({
        success: false,
        message: "QR token mismatch",
      });
    }

    return res.status(200).json({
      success: true,
      message: "QR Verified",
      library: {
        id: library.id,
        name: library.name,
        location: library.location,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "QR verification failed",
    });
  }
};
