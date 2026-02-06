import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

const uploadImage = asyncHandler(async (req, res) => {
  // Check if file is present
  if (!req.file) {
    return sendError(res, 400, "No image file provided");
  }

  const localFilePath = req.file.path;

  // Upload to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

  if (!cloudinaryResponse) {
    return sendError(res, 500, "Failed to upload image to cloud");
  }

  return sendResponse(res, 200, true, "Image uploaded successfully", {
    url: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id,
  });
});

export { uploadImage };
