import cartRepository from "../repositories/cart-repository.js";
import productRepository from "../repositories/product-repository.js";

const getCart = async (userId) => {
  const cart = await cartRepository.getCartByUserId(userId);
  if (!cart) return null;

  return cart;
};

const addItemToCart = async ({
  userId,
  baseProductId,
  variantId,
  quantity,
}) => {
  let productVariant;

  if (variantId) {
    productVariant = await productRepository.getVariantById(variantId);
  } else {
    productVariant = await productRepository.getDefaultVariant(baseProductId);
  }

  if (!productVariant) {
    throw new Error("Product variant not found");
  }

  // STOCK VALIDATION logic
  // 1. Used/Refurbished (Unique Items)
  if (productVariant.inventoryType === "Unique") {
    if (productVariant.status !== "Available") {
      throw new Error("This exclusive item is no longer available.");
    }

    // Enforce Qty = 1
    if (quantity > 1) {
      throw new Error("Unique items can only be added once.");
    }

    // Prevent adding a Unique item that's already in the user's cart
    const existingCart = await cartRepository.getCartByUserId(userId);
    if (existingCart) {
      const alreadyInCart = existingCart.items.some(
        (item) =>
          item.productVariantId._id.toString() ===
          productVariant._id.toString(),
      );
      if (alreadyInCart) {
        throw new Error("This item is already in your cart.");
      }
    }
  }
  // 2. New Items (Quantity Based)
  else {
    // Validate quantity is a positive integer
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new Error(
        "Invalid quantity. Must be a whole number between 1 and 100.",
      );
    }

    // Check existing cart quantity to prevent accumulation exploit.
    // A user calling addToCart 10 times with qty=1 should not bypass a stock=5 check.
    const existingCart = await cartRepository.getCartByUserId(userId);
    const existingQty = existingCart
      ? (existingCart.items.find((item) =>
          item.productVariantId._id
            ? item.productVariantId._id.toString() ===
              productVariant._id.toString()
            : item.productVariantId.toString() ===
              productVariant._id.toString(),
        )?.quantity ?? 0)
      : 0;

    const totalQty = existingQty + qty;
    if (productVariant.stock < totalQty) {
      throw new Error(
        `Only ${productVariant.stock} units available. You already have ${existingQty} in your cart.`,
      );
    }
  }

  const cart = await cartRepository.addOrUpdateCart(
    userId,
    productVariant._id,
    quantity,
    productVariant.sellingPrice,
  );
  return cart;
};

const updateItemQuantity = async ({ userId, variantId, quantity }) => {
  // Validate Stock before updating
  const productVariant = await productRepository.getVariantById(variantId);
  if (!productVariant) throw new Error("Product not found");

  if (productVariant.inventoryType === "Unique" && quantity > 1) {
    throw new Error("Unique items cannot have quantity > 1");
  }
  if (
    productVariant.inventoryType !== "Unique" &&
    productVariant.stock < quantity
  ) {
    throw new Error(`Only ${productVariant.stock} units available.`);
  }

  return await cartRepository.updateItemQuantity(userId, variantId, quantity);
};

const removeItemFromCart = async ({ userId, variantId }) => {
  return await cartRepository.removeItemFromCart(userId, variantId);
};

const clearCart = async ({ userId }) => {
  return await cartRepository.clearCart(userId);
};

export default {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
};
