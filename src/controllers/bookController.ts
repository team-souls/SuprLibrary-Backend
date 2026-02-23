import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { razorpay } from "../utils/razorpay.js";

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const { slotTimingId } = req.body;
    const userId = req.user.userId;

    console.log("Creating order for SlotTiming ID:", slotTimingId, "User ID:", userId);
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

    if (!slotTiming) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // if (slotTiming.activeStudents <= 0) {
    //   return res.status(400).json({ message: "No seats available" });
    // }

    const amount = slotTiming.slotType.price;
    console.log("Calculated amount:", amount);
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const payment = await prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount,
        userId,
        slotTimingId,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        libraryId: slotTiming.slotType.libraryId,
        slotTimingId,
        slotTypeId: slotTiming.slotTypeId,
        userId,
        paymentId: payment.id,
        libraryName: slotTiming.slotType.library.name,
        amount,
        status: "PENDING",
      },
    });
    console.log("Booking created with ID:", booking.id);
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      j:"noe daa"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Order creation failed" });
  }
};



export const verifyPaymentAndBookController = async (req: any, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "FAILED" },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 🔒 Prevent double verification
    if (payment.status === "SUCCESS") {
      return res.json({ message: "Already verified" });
    }

    // 🔥 TRANSACTION
    await prisma.$transaction([
      // Update Payment
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "SUCCESS",
        },
      }),

      // Update Booking
      prisma.booking.update({
        where: { paymentId: payment.id },
        data: {
          status: "SUCCESS",
        },
      }),

      // Increase active students
      // prisma.slotTiming.update({
      //   where: { id: payment.slotTimingId },
      //   data: {
      //     activeStudents: {
      //       increment: 1,
      //     },
      //   },
      // }),


    ]);

    return res.json({
      success: true,
      message: "Payment verified & booking confirmed",
    });
  } catch (error) {
    console.error("Verify Error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

export const trialController = async (req: Request, res: Response) => {
  try {
    const { libraryId, slotTimingId, slotTypeId, libraryName, userId } =
      req.body;

    if (!libraryId || !slotTimingId || !slotTypeId || !libraryName || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const library = await prisma.library.findUnique({
      where: { id: libraryId },
      select: {
        trialDuration: true,
        slotTypes: {
          include: {
            slotTimings: true,
          },
        },
      },
    });

    if (!library) {
      return res.status(404).json({ message: "Library not found" });
    }

    if (!library.slotTypes || library.slotTypes.length === 0) {
      throw new Error("No slot types available for this library");
    }

    if (library.slotTypes.includes(slotTypeId)) {
      throw new Error("Invalid slot type selected");
    }

    if (!library.slotTypes.some((st) => st.slotTimings.some((stt) => stt.id === slotTimingId))) {
      throw new Error("Invalid slot timing selected");
    }
    

    const booking = await prisma.trialBooking.create({
      data: {
        libraryId,
        slotTimingId,
        slotTypeId,
        libraryName,
        trialEndDate: new Date(
          Date.now() +
            (library!.trialDuration as number) * 24 * 60 * 60 * 1000,
        ),
        userId,
        status: "ACTIVE",
      },
    });
    return res.json({ message: "Trial booking created", booking });
  } catch (error) {
    res.status(500).json({ message: "Trial booking failed", error:error instanceof Error ? error.message : error });
  }
};

export const getUserTrialBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params as any;
    console.log(userId);

    const bookings = await prisma.trialBooking.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
    console.log(bookings);
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trial bookings", error });
  }
};

// fetch library trial bookings (library owner dashboard)
export const getLibraryTrialBookingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { libraryId } = req.params as any;
    const bookings = await prisma.trialBooking.findMany({
      where: { libraryId: libraryId as string, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch library trial bookings", error });
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