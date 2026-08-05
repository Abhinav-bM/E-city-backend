import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Check if Cloudinary keys are configured. If missing, use local public/uploads fallback.
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const uploadsDir = "./public/uploads";
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = path.basename(localFilePath);
      const targetPath = path.join(uploadsDir, filename);
      fs.renameSync(localFilePath, targetPath);

      const port = process.env.PORT || 5000;
      const fileUrl = `http://localhost:${port}/public/uploads/${filename}`;
      return {
        secure_url: fileUrl,
        public_id: filename,
      };
    }

    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove locally
    }
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed, using local fallback:", error?.message || error);
    try {
      if (fs.existsSync(localFilePath)) {
        const uploadsDir = "./public/uploads";
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filename = path.basename(localFilePath);
        const targetPath = path.join(uploadsDir, filename);
        fs.renameSync(localFilePath, targetPath);

        const port = process.env.PORT || 5000;
        const fileUrl = `http://localhost:${port}/public/uploads/${filename}`;
        return {
          secure_url: fileUrl,
          public_id: filename,
        };
      }
    } catch (fallbackErr) {
      console.error("Local fallback storage error:", fallbackErr);
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from cloudinary", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
