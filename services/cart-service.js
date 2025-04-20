import cartRepository from "../repositories/cartRepository.js";
import productRepository from "../repositories/product-repository.js";

const addItemToCart = async ({ userId, baseProductId, variantId, quantity }) => {
  let productVariant;

  if (variantId) {
    productVariant = await productRepository.getVariantById(variantId);
  } else {
    productVariant = await productRepository.getDefaultVariant(baseProductId);
  }

  if (!productVariant) {
    throw new Error("Product variant not found");
  }

  const cart = await cartRepository.addOrUpdateCart(userId, productVariant._id, quantity);
  return cart;
};

export default {
  addItemToCart,
};
