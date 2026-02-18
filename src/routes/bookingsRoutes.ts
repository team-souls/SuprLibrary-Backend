import express from "express";
import {  createOrderController, trialController, verifyPaymentAndBookController } from "../controllers/bookController";
import {
  submitReview,
  getReviewsByLibrary,
  getReviewsByOwner,
} from "../controllers/reviewController";

const bookingsRouter = express.Router();

bookingsRouter.post("/create-order", createOrderController);

bookingsRouter.post("/verify-payment", verifyPaymentAndBookController);
bookingsRouter.post("/trial", trialController);

bookingsRouter.post("/review", submitReview);
bookingsRouter.get("/reviews/library/:libraryId", getReviewsByLibrary);
bookingsRouter.get("/reviews/owner/:ownerId", getReviewsByOwner);

export default bookingsRouter;
