import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";
import logger from "../utils/logger.js";

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    logger.warn("Upload attempt with no file in request", {
      ip: req.ip,
      userId: req.user?.userId,
    });
    return sendError(res, 400, "No image file provided");
  }

  const localFilePath = req.file.path;

  const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

  if (!cloudinaryResponse) {
    logger.error("Cloudinary upload failed", {
      userId: req.user?.userId,
      file: req.file.originalname,
    });
    return sendError(res, 500, "Failed to upload image to cloud");
  }

  return sendResponse(res, 200, true, "Image uploaded successfully", {
    url: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id,
  });
});

export { uploadImage };
