import multer from "multer";

const storage = multer.memoryStorage(); 
// memoryStorage because we send buffer directly to Cloudinary

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
