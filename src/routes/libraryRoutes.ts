import express from 'express';

import { createLibraryWithSlots, getAllLibraries, getLibraryByOwnerEmail, getSingleLibrary ,getSingleLibrarySlots,getLibrarySlotsTiming} from '../controllers/libraryControllers.js';
import { upload } from '../middlewares/multer.js';

const libraryRouter = express.Router();

libraryRouter.post('/create', upload.array("images", 5), createLibraryWithSlots);
libraryRouter.get('/',getAllLibraries);
// libraryRouter.get('/:email',getLibraryByOwnerEmail);
libraryRouter.get('/:libraryId', getSingleLibrary);
libraryRouter.get('/:libraryId/slots',getSingleLibrarySlots);
libraryRouter.get('/:libraryId/timings',getLibrarySlotsTiming);
export default libraryRouter;