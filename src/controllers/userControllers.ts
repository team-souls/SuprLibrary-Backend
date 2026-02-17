import { Request, Response } from "express";
import { prisma } from "../config/db.js";
  
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
export const userProfile = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const promoteToOwner = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log("Promote request for email:", email);
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log("User found:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "USER") {
      return res.status(400).json({
        message: "User already promoted",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log("User promoted:", updatedUser);
    res.json({
      message: "User promoted to ADMIN",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Promotion failed" });
  }
};

export const createLibrary = async (req: Request, res: Response) => {
  try {
    const { email, name, location } = req.body;
    console.log(req.body)
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

    // const library = await prisma.library.create({
    //   data: {
    //     name: name as string,
    //     location: location as string,
    //     ownerId: owner.id,
    //   },
    // });

    // res.json({
    //   message: "Library created successfully",
    //   library,
    // });
  } catch (error) {
    res.status(500).json({ message: "Library creation failed" });
  }
};
