import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import libraryRouter from "./routes/libraryRoutes.js";
import imageUploadRoutes from "./upload/imageuploadRoutes.js"
import bookingsRouter from './routes/bookingsRoutes.js';
dotenv.config();
const app = express();

const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  console.log("Health check endpoint hit");
  res.send("Auth server running");
});
app.use("/api/user", userRouter);



app.use("/api/auth",authRouter)
app.use("/api/bookings", bookingsRouter)
app.use("/api/libraries", libraryRouter)

app.use("/api/upload",imageUploadRoutes)



// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Start serverv b
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
