import wishlistServices from "../services/wishlist-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const variantId = req.body.variant_id;
  const wishlist = await wishlistServices.addToWishlist(userId, variantId);
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
  const userId = req.user.userId;
  const variantId = req.body.variant_id;
  const wishlist = await wishlistServices.removeFromWishlist(userId, variantId);
  return sendResponse(
    res,
    200,
    true,
    "Products removed from wishlist successfully",
    wishlist,
  );
});

// Get user wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const wishlist = await wishlistServices.getWishlist(userId);
  return sendResponse(
    res,
    200,
    true,
    "Wishlist fetched successfully",
    wishlist,
  );
});

export { addToWishlist, removeFromWishlist, getWishlist };
