import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (file: string, folder = "avatars") => {
  return cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    overwrite: true,
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};
