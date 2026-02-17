import express from 'express';
import { imageUploader } from './imageController';
import multer from "multer";
const imageUploadRoutes =express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

imageUploadRoutes.post("/image", upload.array("images", 5), imageUploader)
export default imageUploadRoutes;