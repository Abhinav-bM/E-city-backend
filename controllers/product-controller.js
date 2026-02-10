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
  const {
    page = 1,
    limit = 10,
    category,
    brand,
    isActive,
    inventoryType,
    search,
    minPrice,
    maxPrice,
    condition,
    sort,
  } = req.query;

  const filters = {};
  const options = { variantFilters: {} };

  // Global Search (Title or Brand)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    filters.$or = [{ title: searchRegex }, { brand: searchRegex }];
  }

  // Base Product Filters
  if (category) filters.category = category;
  if (brand) filters.brand = { $in: brand.split(",") }; // Support multiple brands
  // Handle isActive filter
  if (isActive !== undefined && isActive !== "") {
    if (isActive === "true" || isActive === "active" || isActive === true) {
      filters.isActive = true;
    } else if (
      isActive === "false" ||
      isActive === "draft" ||
      isActive === false
    ) {
      filters.isActive = false;
    }
  }

  // Handle Home Page Flags
  if (req.query.isFeatured === "true") filters.isFeatured = true;
  if (req.query.isNewArrival === "true") filters.isNewArrival = true;

  // Variant Filters
  if (inventoryType) {
    options.variantFilters.inventoryType = inventoryType;
  }

  if (condition) {
    options.variantFilters.condition = { $in: condition.split(",") };
  }

  if (minPrice || maxPrice) {
    options.variantFilters.sellingPrice = {};
    if (minPrice) options.variantFilters.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) options.variantFilters.sellingPrice.$lte = Number(maxPrice);
  }

  if (sort) {
    options.sort = sort;
  }

  const products = await productServices.getAllProducts(
    filters,
    Number.parseInt(page),
    Number.parseInt(limit),
    null, // userId (can extract from req.user if needed later)
    options,
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

// Get product by base product ID (for editing)
const getProductByBaseId = asyncHandler(async (req, res) => {
  const baseProductId = req.params.id;

  if (!baseProductId || baseProductId.trim().length === 0) {
    return sendError(res, 400, "Invalid product ID");
  }

  try {
    const productDetails =
      await productServices.getProductByBaseId(baseProductId);
    return sendResponse(
      res,
      200,
      true,
      "Product details retrieved successfully",
      productDetails,
    );
  } catch (error) {
    if (
      error.message === "Base product not found" ||
      error.message === "Product not found"
    ) {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = req.body;

  if (!id || id.trim().length === 0) {
    return sendError(res, 400, "Invalid product ID");
  }

  try {
    const updatedProduct = await productServices.updateProduct(id, productData);
    return sendResponse(
      res,
      200,
      true,
      "Product updated successfully",
      updatedProduct,
    );
  } catch (error) {
    if (error.message === "Product not found") {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
});

export {
  addProduct,
  getProductDetails,
  getAllProducts,
  deleteProduct,
  getProductByBaseId,
  updateProduct,
};
