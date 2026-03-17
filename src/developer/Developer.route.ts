import express from "express";
import {
  DevelopercreateLibraryWithSlots,
  DeveloperLibraryByOwnerEmail,
  DeveloperUpdateLibraryWithSlots,
  DeveloperLibraryIdByOwnerId,
  generateLibraryQRToken,
  verifyLibraryQR
} from "./DeveloperCreateLibrary/Developer.Controller.js";
import {
  getAllUsers,
  searchUserByEmail,
  promoteToOwner,
} from "../controllers/DeveloperControllers.js";
import { upload } from "../upload/multer.js";
const DeveloperRouter = express.Router();

DeveloperRouter.post(
  "/create",
  upload.array("images", 5),
  DevelopercreateLibraryWithSlots,
);

DeveloperRouter.get("/email/:email", DeveloperLibraryByOwnerEmail);

DeveloperRouter.get("/owner/:ownerId", DeveloperLibraryIdByOwnerId);

DeveloperRouter.put(
  "/update/:id",
  upload.array("images"),
  DeveloperUpdateLibraryWithSlots,
);

DeveloperRouter.get("/", getAllUsers);

DeveloperRouter.get("/search", searchUserByEmail);
DeveloperRouter.post("/promote", promoteToOwner);
DeveloperRouter.post("/generate-library-qr", generateLibraryQRToken);
DeveloperRouter.post("/scan-library-qr", verifyLibraryQR);

export default DeveloperRouter;
