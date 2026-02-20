import express from "express";
import {
  getAllUsers,
  searchUserByEmail,
  promoteToOwner,
  userProfile,
  editUserProfile,
} from "../controllers/userControllers.js";
import { upload } from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/profile", userProfile);
userRouter.get("/search", searchUserByEmail);
userRouter.post("/promote", promoteToOwner);

userRouter.put( "/edit-profile", upload.single("avatar"), editUserProfile);
export default userRouter;
