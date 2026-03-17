import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./auth/authRoutes/authRoutes.js";
import imageUploadRoutes from "./upload/imageuploadRoutes.js"
import UserbookingsRouter from './user/UserBookings/UserBookingRoutes.js';
import UserReviewRouter from "./user/UserReview/UserReviewRoutes";
import UserattendanceRouter from "./user/UserAttendance/UserAttendanceRoutes";
import UserLibraryRouter from "./user/UserLibrary/user.route.js";
import UserTrailbookingsRouter from "./user/UserTrailBookings/UserTrailBookingsRoutes.js";
import DeveloperRouter from "./developer/Developer.route.js";
import AdminTrailBookings from "./admin/adminTrailBookings/adminTrailBookingsRoutes.js";
import AdminBookingsRouter from "./admin/adminBookings/adminBookingsRoutes.js";
import AdminStudentRouter from "./admin/adminStudentSection/adminStudentSectionRoutes.js";
import adminRouter from "./admin/adminSection/adminRoutes.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  console.log("Health check endpoint hit");
  res.send("Auth server running");
});

//developer apipoints
app.use("/api/developer",DeveloperRouter)
//admin apiendpoints

app.use("/api/admin",adminRouter)
app.use("/api/admin/trail",AdminTrailBookings)
app.use("/api/admin",AdminStudentRouter)
app.use("/api/admin/bookings",AdminBookingsRouter)
//user api endpoints
app.use("/api/auth",authRouter)
app.use("/api/user/libraries", UserLibraryRouter)
app.use("/api/user/reviews",UserReviewRouter)
app.use("/api/trail/", UserTrailbookingsRouter)
///undone work testing phase still 
app.use("/api/user/attendance", UserattendanceRouter)
app.use("/api/user/bookings", UserbookingsRouter)
app.use("/api/upload",imageUploadRoutes)


// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Start serverv b
app.listen(PORT, "0.0.0.0",() => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
