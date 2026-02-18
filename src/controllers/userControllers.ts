import { Request, Response } from "express";

// Optionally extend Request type for user property if using authentication middleware
interface AuthRequest extends Request {
  user?: { id: string };
}
import { prisma } from "../config/db.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../upload/cloudinary";

import { Logger } from "../utils/logger.js";
const logger = Logger.getInstance();
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    logger.info("userController.js","fectched all users")
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const userProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findMany();
    logger.info("usercontroller.js","user found")
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const searchUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    const user = await prisma.user.findUnique({
      where: { email: email as string },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const editUserProfile = async (req: Request, res: Response) => {
  const typedReq = req as AuthRequest;

  try {
    const userId = typedReq.user?.id || req.body.id;
    const { email, name } = req.body;
    const file = req.file; // <-- file from multer

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      logger.info("usercontroller.js","user not found")
      return res.status(404).json({ message: "User not found" });
    }

    const updateData: any = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;

    // ✅ Handle avatar file
    if (file) {
      // Convert buffer to base64 for Cloudinary
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      const uploadRes = await uploadToCloudinary(base64, "avatars");
      updateData.avatar = uploadRes.secure_url;

      // Delete old avatar
      if (user.avatar) {
        const match = user.avatar.match(/\/avatars\/([^\.\/]+)\./);
        const publicId = match ? `avatars/${match[1]}` : undefined;

        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already in use" });
    }

    res.status(500).json({ message: "Failed to update profile" });
    logger.info("usercontroller.js","Failed to update profile");
};


export const promoteToOwner = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
 
    const user = await prisma.user.findUnique({
      where: { email },
    });
    logger.info("usercontroller.js","user found by email id")
    if (!user) {
       logger.info("usercontroller.js","user")
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "USER") {
      return res.status(400).json({
        message: "User already is ADMIN",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    
    res.json({
      message: "User promoted to ADMIN",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Promotion failed" });
  }
};

// export const createLibrary = async (req: Request, res: Response) => {
//   try {
//     const { email, name, location } = req.body;
//     console.log(req.body);
//     // const owner = await prisma.user.findUnique({
//     //   where: { email },
//     //   include: { library: true },
//     // });

//     // if (!owner) {
//     //   return res.status(404).json({ message: "User not found" });
//     // }

//     // if (owner.role !== "ADMIN") {
//     //   return res.status(400).json({
//     //     message: "User is not an ADMIN",
//     //   });
//     // }

//     // if (owner.library) {
//     //   return res.status(400).json({
//     //     message: "Owner already has a library",
//     //   });
//     // }

//     // const library = await prisma.library.create({
//     //   data: {
//     //     name: name as string,
//     //     location: location as string,
//     //     ownerId: owner.id,
//     //   },
//     // });

//     // res.json({
//     //   message: "Library created successfully",
//     //   library,
//     // });
//   } catch (error) {
//     res.status(500).json({ message: "Library creation failed" });
//   }
// }
