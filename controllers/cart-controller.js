import cartService from "../services/cart-service.js";
import ApiResponse from "../utils/api-response.js";

const addToCart = async (req, res) => {
  try {
    const user_id = "67e409c7c3aa0fe93489adc5";
    const product_variant_id = req.body.id;
    const cart = await cartService.addToCart(user_id, product_variant_id);
    const apiResponse = new ApiResponse();
    apiResponse.data = cart;
    apiResponse.message = "Product added to cart successfully";
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error adding product to cart : ", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = error;
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

export { addToCart };
