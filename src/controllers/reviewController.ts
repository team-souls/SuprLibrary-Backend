import { Request, Response } from "express";
import { prisma } from "../config/db.js";

export const submitReview = async (req: Request, res: Response) => {
  try {
    const { ratings, description, userId, libraryId } = req.body;
    if (!ratings || !description || !userId || !libraryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log(req.body);
    const rating = Number(ratings);
    const review = await prisma.review.create({
      data: {
        rating,
        description,
        userId,
        libraryId,
      },
    });
    res.json({ message: "Review submitted", review });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit review", error });
  }
};

export const getReviewsByLibrary = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params;

    if (!libraryId) {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const reviews = await prisma.review.findMany({
      where: { libraryId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
           
            name: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(200).json({
      reviews,
    });
    
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
};

export const getReviewsByOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params as any;
    const reviews = await prisma.review.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error });
  }
};
