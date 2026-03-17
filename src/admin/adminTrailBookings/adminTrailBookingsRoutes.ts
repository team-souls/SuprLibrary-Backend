import express from 'express'
import { getLibraryTrialBookingsController } from './adminTrailBookings';

const AdminTrailBookings=express.Router()


AdminTrailBookings.get(
  "/library/:libraryId",
  getLibraryTrialBookingsController,
);
export default AdminTrailBookings