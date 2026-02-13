import Brand from "../models/brand-model.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Get all brands
const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true })
    .select("name slug logo")
    .sort({ name: 1 });

  return sendResponse(res, 200, true, "Brands fetched successfully", brands);
});

// Create a new brand
const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return sendError(res, 400, "Brand name is required");
  }

  // Check if brand already exists (case insensitive)
  const existingBrand = await Brand.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (existingBrand) {
    return sendResponse(res, 200, true, "Brand already exists", existingBrand);
  }

  const newBrand = await new Brand({ name }).save();

  return sendResponse(res, 201, true, "Brand created successfully", newBrand);
});

export default {
  getAllBrands,
  createBrand,
};
