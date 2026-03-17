import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { razorpay } from "../../utils/razorpay.js";

export const createOrderController = async (req: any, res: Response) => {
  try {
    const { slotTimingId } = req.body;
    const userId = req.user.userId;

    const slotTiming = await prisma.slotTiming.findUnique({
      where: { id: slotTimingId },
      include: {
        slotType: {
          include: { library: true },
        },
      },
    });

    if (!slotTiming) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    const price = slotTiming.slotType.price;
    const amount = Math.round(price * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    const payment = await prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: amount,
        userId,
        slotTimingId,
        status: "CREATED",
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount,
      paymentId: payment.id,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};



export const verifyPaymentAndBookController = async (req: any, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: {
        slotTiming: {
          include: {
            slotType: {
              include: { library: true },
            },
          },
        },
        user: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const slotTiming = payment.slotTiming;
    console.log(` the slot paymment method is ${slotTiming}`)
    // booking start & end time
    const startDate = new Date(slotTiming.startTime);
    const endDate = new Date(slotTiming.endTime);

    const booking = await prisma.$transaction(async (tx) => {

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "SUCCESS",
        },
      });

      const newBooking = await tx.booking.create({
        data: {
          libraryId: slotTiming.slotType.libraryId,
          slotTimingId: slotTiming.id,
          slotTypeId: slotTiming.slotTypeId,
          userId: payment.userId,
          paymentId: payment.id,
          libraryName: slotTiming.slotType.library.name,
          amount: payment.amount,
          startDate,
          endDate,
          status: "SUCCESS",
        },
      });

      await tx.slotTiming.update({
        where: { id: slotTiming.id },
        data: {
          activeStudents: {
            increment: 1,
          },
        },
      });

      return newBooking;
    });

    res.json({
      success: true,
      message: "Payment verified and booking created",
      booking,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};



// fetch user bookings (user dashboard)
export const getUserBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params as any;
    const bookings = await prisma.booking.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error });
  }
};

// fetch library bookings (library owner dashboard)
export const getLibraryBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { libraryId } = req.params as any;
    const bookings = await prisma.booking.findMany({
      where: { libraryId: libraryId as string },
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error });
  }
};

// fetch booking details (for booking details page)
export const getBookingDetailsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { bookingId } = req.params as any;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId as string },
    });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking details", error });
  }
};

// fetch booking details (for booking details page)
export const getTrialBookingDetailsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { trialBookingId } = req.params as any;
    const booking = await prisma.trialBooking.findUnique({
      where: { id: trialBookingId as string },
    });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking details", error });
  }
};



export const getBookingPreview = async (req: Request, res: Response) => {
  try {
    const { slotTimingId } = req.params;
    console.log("Preview Request for SlotTiming ID:", slotTimingId);
    if (!slotTimingId) {
      return res.status(400).json({
        success: false,
        message: "slotTimingId is required",
      });
    }

    console.log("code run")
    const slotTiming = await prisma.slotTiming.findUnique({
      where: { id: slotTimingId },
      include: {
        slotType: {
          include: {
            library: true,
          },
        },
      },
    });
    console.log(slotTiming)
    if (!slotTiming) {
      return res.status(404).json({
        success: false,
        message: "Slot timing not found",
      });
    }
      console.log("sdsdsdsa")
    const library = slotTiming.slotType.library;
    const slotType = slotTiming.slotType;

 
    if (slotTiming.activeStudents >= library.totalSeats) {
      return res.status(400).json({
        success: false,
        message: "Slot is full",
      });
    }

    // 3️⃣ Calculate final amount
    const basePrice = slotType.price;
    const tax = 0; // Add GST logic later if needed
    const finalAmount = basePrice + tax;

  console.log( library.name)
    return res.status(200).json({ 
      success: true,
      data: {
        libraryName: library.name,
        slotName: slotType.typeName,
        startTime: slotTiming.startTime,
        endTime: slotTiming.endTime,
        amount: finalAmount,
        availableSeats:
          library.totalSeats - slotTiming.activeStudents,
      },
    });
  } catch (error) {
    console.error("Preview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




export const getActiveBookingByUser = async (userId: string) => {
  const activeBooking = await prisma.booking.findFirst({
    where: {
      userId: userId,
      status: "SUCCESS",
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
      },
    },
    include: {
      library: true,
      slotTiming: true,
      slotType: true,
      payment: true,
    },
  });

  return activeBooking;
};



export const getUserActiveBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const booking = await getActiveBookingByUser(userId);
    console.log(booking)
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No active booking found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};