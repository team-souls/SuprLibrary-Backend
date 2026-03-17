import express from "express";
import {
  fetchUserReviewsByLibrary,
  UsersubmitReview,
} from "./userReviewController";


const UserReviewRouter = express.Router();


UserReviewRouter.post("/create", UsersubmitReview);

UserReviewRouter.get("/library/:libraryId", fetchUserReviewsByLibrary);

export default UserReviewRouter;
