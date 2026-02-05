import productServices from "../services/product-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Create product with variants
const addProduct = asyncHandler(async (req, res) => {
  const productData = req.body;
  console.log(productData);
  const productDetails = await productServices.addProduct(productData);
  return sendResponse(res, 201, true, "Product added successfully", {
    productDetails,
  });
});

// Get product details by variantSlug
// Returns current variant details, base product info, and all available variants for switching
const getProductDetails = asyncHandler(async (req, res) => {
  const variantSlug = req.params.slug;

  // Validate slug format
  if (!variantSlug || variantSlug.trim().length === 0) {
    return sendError(res, 400, "Invalid variant slug format");
  }

  try {
    const productDetails = await productServices.getProductDetails(variantSlug);
    return sendResponse(
      res,
      200,
      true,
      "Product details retrieved successfully",
      productDetails,
    );
  } catch (error) {
    // Handle specific error cases manually if needed, or let global handler catch generic ones
    if (
      error.message === "Variant not found" ||
      error.message === "Base product not found"
    ) {
      return sendError(res, 404, error.message);
    }
    throw error; // Re-throw to global handler
  }
});

// Get all products for listing
const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, brand } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (brand) filters.brand = brand;

  const products = await productServices.getAllProducts(
    filters,
    Number.parseInt(page),
    Number.parseInt(limit),
  );

  return sendResponse(
    res,
    200,
    true,
    "Products retrieved successfully",
    products,
  );
});

// Soft Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await productServices.deleteProduct(id);

  return sendResponse(
    res,
    200,
    true,
    `Product ${result.isActive ? "activated" : "deactivated"} successfully`,
    result,
  );
});

export { addProduct, getProductDetails, getAllProducts, deleteProduct };
