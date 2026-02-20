
import express from "express";
import {
  generateQrToken,
  getAttendance,
  getLibraryAttendance,
  getSlotAttendance,
  scanAttendance,} from "../controllers/attendanceController";

const attendanceRouter = express.Router();

attendanceRouter.post("/generate-qr", generateQrToken);
attendanceRouter.post("/scan", scanAttendance);
attendanceRouter.get("/user/:userId", getAttendance);
attendanceRouter.get("/library/:libraryId", getLibraryAttendance);
attendanceRouter.get("/slot/:slotTimingId", getSlotAttendance);

export default attendanceRouter;