import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { Logger } from "../utils/logger.js";


const logger = Logger.getInstance();
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    logger.info("userController.js", "fectched all users");
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

    res.status(200).json({ message: "Success", data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



export const promoteToOwner = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });
    logger.info("usercontroller.js", "user found by email id");
    if (!user) {
      logger.info("usercontroller.js", "user");
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
