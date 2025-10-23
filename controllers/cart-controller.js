import { REFUSED } from "dns";
import cartService from "../services/cart-service.js";

/**
 *  required : function to get all cart product with image, price etc..
 *             function to remove product from cart
 */

const addToCart = async (req, res) => {
  // try {
  //   const { baseProductId, variantId, quantity } = req.body;

  //   const userId = "67e409c7c3aa0fe93489adc5"; // hardcoded remove this onece the user auth done

  //   const cart = await cartService.addItemToCart({
  //     userId,
  //     baseProductId,
  //     variantId,
  //     quantity,
  //   });

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Product added successfully";
  //   apiResponse.data = cart;
  //   apiResponse.statusCode = 201;

  //   res.status(200).json(apiResponse);
  // } catch (error) {
  //   console.error("Error while adding prodcut to cart : ", error);

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Error while creating product";
  //   apiResponse.error = error.message;
  //   apiResponse.statusCode = 500;

  //   return res.status(500).json(apiResponse);
  // }
};

export { addToCart };
