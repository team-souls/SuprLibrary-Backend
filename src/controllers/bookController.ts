import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { razorpay } from "../utils/razorpay.js";

// Razorpay simulation (replace with real integration)
const simulateRazorpayPayment = async (amount: number) => {
  
  const success = Math.random() > 0.2; // 80% success
  return {
    status: success ? "SUCCESS" : "FAILED",
    paymentId:
      success ? `pay_${Math.floor(Math.random() * 1000000)}` : undefined,
  };
};

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const order = await razorpay.orders.create({
      amount: Number(amount) * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error,
    });
  }
};

export const verifyPaymentAndBookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      libraryId,
      slotTimingId,
      slotTypeId,
      timing,
      libraryName,
      amount,
      userId,
    } = req.body;

    // 🔐 Verify Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        timing: new Date(timing),
        libraryName,
        amount: Number(amount),
        userId,
        status: "SUCCESS",
        paymentId: razorpay_payment_id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking successful",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error,
    });
  }
};

export const trialController = async (req: Request, res: Response) => {
  try {
    const { libraryId, slotTimingId, slotTypeId, timing, libraryName, userId } =
      req.body;

    const trialDuration 
    const booking = await prisma.booking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        timing: new Date(timing),
        libraryName,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
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
