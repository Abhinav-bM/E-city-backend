import productServices from "../services/product-service.js";
import ApiResponse from "../utils/api-response.js";

const addProduct = async (req, res) => {
  try {
    const obj = req.body;
    const productDetails = await productServices.addProduct(obj);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Product added successfully";
    apiResponse.data = { productDetails };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while creating product : ", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while creating product";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productServices.getAllProducts();
    const apiResponse = new ApiResponse();
    apiResponse.message = "Products fetched successfully";
    apiResponse.data = products;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while fetching products", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching products";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

const getProduct = async (req, res) => {
  try {
    const product_id = req.params.id;
    const product = await productServices.getProduct(product_id);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Product fetched successfully";
    apiResponse.data = product;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while fetching product", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching product";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

export default { addProduct, getAllProducts, getProduct };
