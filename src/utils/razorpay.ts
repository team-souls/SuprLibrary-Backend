
import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();
console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
