import { Request, Response } from "express";
import { prisma } from "../config/db.js";


const simulateRazorpayPayment = async (amount: number) => {
  
  const success = Math.random() > 0.2; // 80% success
  return {
    status: success ? "SUCCESS" : "FAILED",
    paymentId:
      success ? `pay_${Math.floor(Math.random() * 1000000)}` : undefined,
  };
};

export const bookController = async (req: Request, res: Response) => {
  try {
    const {
      libraryId,
      slotTimingId,
      slotTypeId,
      timing,
      libraryName,
      amount,
      userId,
    } = req.body;
    
    const paymentResult = await simulateRazorpayPayment(amount);
    const booking = await prisma.booking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        timing: new Date(timing),
        libraryName,
        amount,
        userId,
        status: paymentResult.status,
        paymentId: paymentResult.paymentId,
      },
    });
    if (paymentResult.status === "SUCCESS") {
      return res.json({ message: "Booking successful", booking });
    } else {
      return res.status(402).json({ message: "Payment failed", booking });
    }
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error });
  }
};

export const trialController = async (req: Request, res: Response) => {
  try {
    const { libraryId, slotTimingId, slotTypeId, timing, libraryName, userId } =
      req.body;
    const booking = await prisma.booking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        timing: new Date(timing),
        libraryName,
        amount: 0,
        userId,
        status: "TRIAL",
      },
    });
    return res.json({ message: "Trial booking created", booking });
  } catch (error) {
    res.status(500).json({ message: "Trial booking failed", error });
  }
};
