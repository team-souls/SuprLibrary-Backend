import express from "express";
import { bookController, trialController } from "../controllers/bookController";
import {
  submitReview,
  getReviewsByLibrary,
  getReviewsByOwner,
} from "../controllers/reviewController";

const bookingsRouter = express.Router();

bookingsRouter.post("/book", bookController);
bookingsRouter.post("/trial", trialController);

bookingsRouter.post("/review", submitReview);
bookingsRouter.get("/reviews/library/:libraryId", getReviewsByLibrary);
bookingsRouter.get("/reviews/owner/:ownerId", getReviewsByOwner);

export default bookingsRouter;
