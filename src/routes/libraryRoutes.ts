import express from "express";

import {
  createLibraryWithSlots,
  getAllLibraries,
  getLibraryByOwnerEmail,
  getSingleLibrary,
  getSingleLibrarySlots,
  getLibrarySlotsTiming,
  updateLibraryWithSlots,
 getLibraryIdByOwnerId
} from "../controllers/libraryControllers.js";
import { upload } from "../middlewares/multer.js";

const libraryRouter = express.Router();

libraryRouter.post(
  "/create",
  upload.array("images", 5),
  createLibraryWithSlots,
);
libraryRouter.get("/", getAllLibraries);
libraryRouter.get("/email/:email", getLibraryByOwnerEmail);
libraryRouter.get("/:libraryId", getSingleLibrary);
libraryRouter.get("/:libraryId/slots", getSingleLibrarySlots);
libraryRouter.get("/:slot/timings", getLibrarySlotsTiming);
libraryRouter.get("/owner/:ownerId", getLibraryIdByOwnerId);


libraryRouter.put(
  "/update/:id",
  upload.array("images"),
  updateLibraryWithSlots,
);
export default libraryRouter;
