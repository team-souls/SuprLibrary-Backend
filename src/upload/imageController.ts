import { Request, Response } from "express";
import cloudinary from '../config/cloudinary.js';
import dotenv from "dotenv";
dotenv.config();
export const imageUploader =  async function(req: Request, res: Response){

 try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file: any) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "node_multiple_uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    const response = results.map((item: any) => ({
      url: item.secure_url,
      public_id: item.public_id,
    }));

    res.status(200).json({
      message: "All images uploaded successfully",
      images: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }



}