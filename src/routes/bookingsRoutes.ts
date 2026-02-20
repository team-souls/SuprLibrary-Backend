import express from "express";
import {  createOrderController, getLibraryTrialBookingsController, getTrialBookingDetailsController, getUserTrialBookingsController, trialController, verifyPaymentAndBookController } from "../controllers/bookController";
import {
  submitReview,
  getReviewsByLibrary,
} from "../controllers/reviewController";

const bookingsRouter = express.Router();

bookingsRouter.post("/create-order", createOrderController);

bookingsRouter.post("/verify-payment", verifyPaymentAndBookController);
bookingsRouter.post("/trial", trialController);
bookingsRouter.get("/trial/user/:userId", getUserTrialBookingsController);
bookingsRouter.get("/trial/library/:libraryId", getLibraryTrialBookingsController);
bookingsRouter.get("/trial/details/:trialBookingId", getTrialBookingDetailsController);

bookingsRouter.post("/review", submitReview);
bookingsRouter.get("/reviews/library/:libraryId", getReviewsByLibrary);
// bookingsRouter.get("/reviews/owner/:ownerId", getReviewsByOwner);

export default bookingsRouter;
