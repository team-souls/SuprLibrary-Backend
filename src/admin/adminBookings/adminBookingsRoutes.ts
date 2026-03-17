
import express from 'express'
import { getLibraryBookings } from './adminBookingsController';

const AdminBookingsRouter=express.Router()




AdminBookingsRouter.get("/:libraryId", getLibraryBookings);


export default  AdminBookingsRouter