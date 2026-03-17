import express from "express"
import { AdminLibrarySlotsTiming, AdminSingleLibraryWithSlots, getLibraryIdByOwnerId } from "./adminController"
const adminRouter=express.Router()


adminRouter.get("/owner/:ownerId",getLibraryIdByOwnerId)
adminRouter.get("/:libraryId/slots",  AdminSingleLibraryWithSlots);
adminRouter.get("/:slot/timings", AdminLibrarySlotsTiming);
export default adminRouter