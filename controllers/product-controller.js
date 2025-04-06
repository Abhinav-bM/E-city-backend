import productServices from "../services/product-service.js";
import ApiResponse from "../utils/api-response.js";

// Create product with variants
const addProduct = async (req, res) => {
  try {
    const productData = req.body;
    const productDetails = await productServices.addProduct(productData);

    const apiResponse = new ApiResponse();
    apiResponse.message = "Product added successfully";
    apiResponse.data = productDetails;
    apiResponse.statusCode = 201;

    res.status(201).json(apiResponse);
  } catch (error) {
    console.error("Error while creating product: ", error);

    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while creating product";
    apiResponse.error = error.message;
    apiResponse.statusCode = 500;

    return res.status(500).json(apiResponse);
  }
};

// Get product details with variants
const getProductDetails = async (req, res) => {
  try {
    const baseProductId = req.params.id;
    const productDetails =
      await productServices.getProductDetails(baseProductId);

    const apiResponse = new ApiResponse();
    apiResponse.message = "Product details retrieved successfully";
    apiResponse.data = productDetails;
    apiResponse.statusCode = 200;

    return res.status(200).json(apiResponse);
  } catch (error) {
    console.error("Error while fetching product details: ", error);

    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching product details";
    apiResponse.error = error.message;
    apiResponse.statusCode = 500;

    return res.status(500).json(apiResponse);
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

    const apiResponse = new ApiResponse();
    apiResponse.message = "Products retrieved successfully";
    apiResponse.data = products;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (error) {
    console.error("Error while fetching products: ", error);

    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching products";
    apiResponse.error = error.message;
    apiResponse.statusCode = 500;

    return res.status(500).json(apiResponse);
  }
};

export { addProduct, getProductDetails, getAllProducts };
