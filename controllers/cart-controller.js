import cartService from "../services/cart-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 *  required : function to get all cart product with image, price etc..
 *             function to remove product from cart
 */

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const cart = await cartService.getCart(userId);
  return sendResponse(res, 200, true, "Cart fetched successfully", cart);
});

const addToCart = asyncHandler(async (req, res) => {
  const { baseProductId, variantId, quantity } = req.body;
  const userId = req.user.userId;

  const cart = await cartService.addItemToCart({
    userId,
    baseProductId,
    variantId,
    quantity,
  });

  return sendResponse(res, 201, true, "Product added successfully", cart);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { variantId, quantity } = req.body;
  const userId = req.user.userId;

  const cart = await cartService.updateItemQuantity({
    userId,
    variantId,
    quantity,
  });

  return sendResponse(res, 200, true, "Cart updated successfully", cart);
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { variantId } = req.body; // Expecting variantId in body or query? Usually body for updates
  const userId = req.user.userId;

  const cart = await cartService.removeItemFromCart({ userId, variantId });

  return sendResponse(res, 200, true, "Item removed successfully", cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  await cartService.clearCart({ userId });
  return sendResponse(res, 200, true, "Cart cleared successfully", null);
});

export { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
