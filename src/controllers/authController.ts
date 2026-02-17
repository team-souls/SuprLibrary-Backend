import { client } from "../config/google.js";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { prisma } from "../config/db.js";

dotenv.config();

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "ID Token is required",
      });
    }

    // ✅ 1️⃣ Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // ✅ 2️⃣ Find user in DB
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    // ✅ 3️⃣ If not exists → create user
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email: email!,
          name,
          avatar: picture,
          role: "USER", // default role
        },
      });
    }

    // ✅ 4️⃣ Create JWT using DB user role
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user,
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};
