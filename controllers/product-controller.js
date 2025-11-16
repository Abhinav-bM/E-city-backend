import productServices from "../services/product-service.js";

// Create product with variants
const addProduct = async (req, res) => {
  try {
    const productData = req.body;
    console.log(productData);
    const productDetails = await productServices.addProduct(productData);
    res.json({
      success: true,
      data: {
        productDetails,
      },
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Error while creating product: ", error);
    res.status(500).json({
      success: false,
      message: "Error while creating product",
      error: error.message,
    });
  }
};

// Get product details by variantSlug
// Returns current variant details, base product info, and all available variants for switching
const getProductDetails = async (req, res) => {
  try {
    const variantSlug = req.params.slug;

    // Validate slug format
    if (!variantSlug || variantSlug.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant slug format",
      });
    }

    const productDetails = await productServices.getProductDetails(variantSlug);

    return res.status(200).json({
      success: true,
      data: productDetails,
      message: "Product details retrieved successfully",
    });
  } catch (error) {
    console.error("Error while fetching product details: ", error);

    // Handle specific error cases
    if (
      error.message === "Variant not found" ||
      error.message === "Base product not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error while fetching product details",
      error: error.message,
    });
  }
};

// Get all products for listing
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, brand } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;

    const products = await productServices.getAllProducts(
      filters,
      Number.parseInt(page),
      Number.parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: products,
      message: "Products retrieved successfully",
    });
  } catch (error) {
    console.error("Error while fetching products: ", error);

    res.status(500).json({
      success: false,
      message: "Error while fetching products",
      error: error.message,
    });
  }
};

export { addProduct, getProductDetails, getAllProducts };
