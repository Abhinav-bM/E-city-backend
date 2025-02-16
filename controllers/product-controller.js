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
    next(error);
  }
};

export default { addProduct };
