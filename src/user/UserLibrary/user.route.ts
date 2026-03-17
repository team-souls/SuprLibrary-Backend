import express from "express";
import {  UserAllLibraries ,UserLibrarySlotsTiming,UserSingleLibrary,UserSingleLibraryWithSlots} from "./user.controller";
const UserLibraryRouter = express.Router();


UserLibraryRouter.get("/",  UserAllLibraries);
UserLibraryRouter.get("/:libraryId",  UserSingleLibrary);
UserLibraryRouter.get("/:libraryId/slots",  UserSingleLibraryWithSlots);
UserLibraryRouter.get("/slot/:slot/timings",  UserLibrarySlotsTiming);

export default UserLibraryRouter;
