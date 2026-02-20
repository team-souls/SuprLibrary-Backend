import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { razorpay } from "../utils/razorpay.js";

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const liabraryId = req.body.libraryId as string;
    const slotId = await prisma.library.findUnique({
      where: { id: liabraryId },
      select: { slotTypes: { select: { id: true } } },
    });

    if (!slotId) {
      return res.status(404).json({ message: "Library not found" });
    }

    

    const order = await razorpay.orders.create({
      amount: Number() * 100, // convert to paise
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

    const liabrary = await prisma.library.findUnique({
      where: { id: libraryId },
      select: { trialDuration: true },
    });
    const booking = await prisma.booking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        timing: new Date(timing),
        libraryName,
        trialEndDate: new Date(Date.now() + (liabrary!.trialDuration as number) * 24 * 60 * 60 * 1000),
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


// fetch user trial bookings (user dashboard)
export const getUserTrialBookingsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as any; 
    const bookings = await prisma.booking.findMany({
      where: { userId: userId as string, status: "TRIAL" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trial bookings", error });
  }};

// fetch library trial bookings (library owner dashboard)
export const getLibraryTrialBookingsController = async (req: Request, res: Response) => {
  try {
    const { libraryId } = req.params as any;
    const bookings = await prisma.booking.findMany({
      where: { libraryId: libraryId as string, status: "TRIAL" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch library trial bookings", error });
  }
};

// fetch user bookings (user dashboard)
export const getUserBookingsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as any; 
    const bookings = await prisma.booking.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error });
  }};

// fetch library bookings (library owner dashboard)
export const getLibraryBookingsController = async (req: Request, res: Response) => {
  try {    
    const { libraryId } = req.params as any;
    const bookings = await prisma.booking.findMany({
      where: { libraryId: libraryId as string },  
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error });
  }};

// fetch booking details (for booking details page)
export const getBookingDetailsController = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params as any;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId as string },
    });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking details", error });
  }};