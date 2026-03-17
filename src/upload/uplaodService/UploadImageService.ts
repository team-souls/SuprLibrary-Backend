import cloudinary from "../../config/cloudinary";

export const UploadServiceImage = async (req: Request, res: Response) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const folder = "signed_test_uploads";

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return res.json({
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate signature",
    });
  }
};
