import express from "express";
;

import { authMiddleware } from "../../auth/middlewares/jwtMiddleware.js";
import { createOrderController, getBookingPreview, verifyPaymentAndBookController ,getUserActiveBooking} from "./UserBookingControllers.js";
const UserbookingsRouter = express.Router();

UserbookingsRouter.post("/create-order", authMiddleware, createOrderController);

UserbookingsRouter.post("/verify-payment", verifyPaymentAndBookController);



UserbookingsRouter.get("/preview/:slotTimingId", getBookingPreview);

UserbookingsRouter.get("/active/:userId",getUserActiveBooking)

export default UserbookingsRouter;
