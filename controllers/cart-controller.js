import { REFUSED } from "dns";
import cartService from "../services/cart-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 *  required : function to get all cart product with image, price etc..
 *             function to remove product from cart
 */

const addToCart = asyncHandler(async (req, res) => {
  //   const { baseProductId, variantId, quantity } = req.body;
  //
  //   const userId = "67e409c7c3aa0fe93489adc5"; // hardcoded remove this onece the user auth done
  //
  //   const cart = await cartService.addItemToCart({
  //     userId,
  //     baseProductId,
  //     variantId,
  //     quantity,
  //   });
  //
  //   return sendResponse(res, 201, true, "Product added successfully", cart);
});

export { addToCart };
