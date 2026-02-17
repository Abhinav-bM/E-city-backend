import CART from "../models/cart-model.js";
import { PRODUCT_VARIANT, BASE_PRODUCT } from "../models/product-model.js";

// Reusable populate config to ensure consistent data shape across all operations
const CART_POPULATE_CONFIG = {
  path: "items.productVariantId",
  model: "ProductVariant",
  populate: {
    path: "baseProductId",
    model: "BaseProduct",
    select: "title images slug brand category",
  },
};

const getCartByUserId = async (userId) => {
  return await CART.findOne({ userId }).populate(CART_POPULATE_CONFIG);
};

const addOrUpdateCart = async (
  userId,
  productVariantId,
  quantity,
  priceAtAdd,
) => {
  let cart = await CART.findOne({ userId });

  if (!cart) {
    cart = new CART({
      userId,
      items: [{ productVariantId, quantity, priceAtAdd }],
      totalItems: quantity,
      subtotal: priceAtAdd * quantity,
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productVariantId.toString() === productVariantId.toString(),
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].priceAtAdd = priceAtAdd;
    } else {
      cart.items.push({ productVariantId, quantity, priceAtAdd });
    }

    recalculateCart(cart);
  }

  const savedCart = await cart.save();
  return await savedCart.populate(CART_POPULATE_CONFIG);
};

const updateItemQuantity = async (userId, productVariantId, quantity) => {
  const cart = await CART.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) => item.productVariantId.toString() === productVariantId.toString(),
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    recalculateCart(cart);
    const savedCart = await cart.save();
    return await savedCart.populate(CART_POPULATE_CONFIG);
  }
  // Item not found — return populated cart anyway
  return await cart.populate(CART_POPULATE_CONFIG);
};

const removeItemFromCart = async (userId, productVariantId) => {
  const cart = await CART.findOne({ userId });
  if (!cart) return null;

  cart.items = cart.items.filter(
    (item) => item.productVariantId.toString() !== productVariantId.toString(),
  );

  recalculateCart(cart);
  const savedCart = await cart.save();
  return await savedCart.populate(CART_POPULATE_CONFIG);
};

const clearCart = async (userId) => {
  return await CART.findOneAndDelete({ userId });
};

// Helper to recalculate totals
const recalculateCart = (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0,
  );
};

export default {
  getCartByUserId,
  addOrUpdateCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
};
