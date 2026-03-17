
import express from 'express'
import { AdminLibrarySlotsTiming, AdminSingleLibraryWithSlots } from './adminStudentSection';

const AdminStudentRouter=express.Router()



AdminStudentRouter.get("/:libraryId/slots",  AdminSingleLibraryWithSlots);
AdminStudentRouter.get("/slot/:slot/timings", AdminLibrarySlotsTiming);



export default  AdminStudentRouter