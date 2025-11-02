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

// Get product details with variants
const getProductDetails = async (req, res) => {
  try {
    const baseProductId = req.params.id;
    const productDetails =
      await productServices.getProductDetails(baseProductId);
    return res.json({
      data: productDetails,
    });
  } catch (error) {
    console.error("Error while fetching product details: ", error);
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

    res.json({
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
