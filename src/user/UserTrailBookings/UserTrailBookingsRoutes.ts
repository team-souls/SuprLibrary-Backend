import express from "express";
import { getUserTrialBookingsController, trialController } from "./UserTrailBookingsControllers";

const UserTrailbookingsRouter=express.Router()


UserTrailbookingsRouter.post("/create", trialController);
UserTrailbookingsRouter.get("/user/:userId", getUserTrialBookingsController);



export default UserTrailbookingsRouter;