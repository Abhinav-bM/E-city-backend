import wishlistServices from "../services/wishlist-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
  const userId = "67e409c7c3aa0fe93489adc5";
  const productId = req.body.product_id;
  const wishlist = await wishlistServices.addToWishlist(userId, productId);
  return sendResponse(
    res,
    200,
    true,
    "Products add to wishlist successfully",
    wishlist,
  );
});

// Remove product from wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
  console.log("PRODUCT ID : ");
  const userId = "67e409c7c3aa0fe93489adc5";
  const productId = req.body.product_id;
  console.log("PRODUCT ID : ", productId);
  const wishlist = await wishlistServices.removeFromWishlist(userId, productId);
  return sendResponse(
    res,
    200,
    true,
    "Products removed from wishlist successfully",
    wishlist,
  );
});

export { addToWishlist, removeFromWishlist };
