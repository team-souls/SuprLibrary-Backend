
import express from "express";
import {
  getAttendance,
  getLibraryAttendance,
  getSlotAttendance,
  scanAttendance,} from "./UserAttendanceController.js";

const UserattendanceRouter = express.Router();

UserattendanceRouter.post("/scan", scanAttendance);
UserattendanceRouter.get("/user/:userId", getAttendance);
UserattendanceRouter.get("/library/:libraryId", getLibraryAttendance);
UserattendanceRouter.get("/slot/:slotTimingId", getSlotAttendance);

export default UserattendanceRouter;