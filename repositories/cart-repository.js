import CART from "../models/cartModel.js";
import { PRODUCT_VARIANT, BASE_PRODUCT } from "../models/product-model.js";

const addOrUpdateCart = async (userId, productVariantId, quantity) => {
  let cart = await CART.findOne({ userId });

  const product = await PRODUCT_VARIANT.findById(productVariantId);

  if (!product) throw new Error("Product not found");

  if (!cart) {
    cart = new CART({
      userId,
      items: [{ productVariantId, quantity }],
      totalItems: quantity,
      subtotal: product.price * quantity,
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.productVariantId.toString() === productVariantId.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productVariantId, quantity });
    }

    // Recalculate
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    let subtotal = 0;
    for (const item of cart.items) {
      const variant = await PRODUCT_VARIANT.findById(item.productVariantId);
      subtotal += variant.price * item.quantity;
    }

    cart.subtotal = subtotal;
  }

  return await cart.save();
};

export default {
  addOrUpdateCart,
};
