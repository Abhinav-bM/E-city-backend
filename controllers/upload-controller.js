import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

const uploadImage = asyncHandler(async (req, res) => {
  // Check if file is present
  if (!req.file) {
    console.error("Upload failed: No file in request");
    return sendError(res, 400, "No image file provided");
  }

  console.log("Uploading file:", req.file.path);
  const localFilePath = req.file.path;

  // Upload to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

  if (!cloudinaryResponse) {
    console.error("Cloudinary upload failed for file:", localFilePath);
    return sendError(res, 500, "Failed to upload image to cloud");
  }

  console.log("Upload successful:", cloudinaryResponse.secure_url);
  return sendResponse(res, 200, true, "Image uploaded successfully", {
    url: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id,
  });
});

export { uploadImage };
