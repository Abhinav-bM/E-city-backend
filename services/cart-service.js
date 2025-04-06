import cartRepository from "../repositories/cart-repository.js";

const addToCart = async (user_id, product_variant_id) => {
  return await cartRepository.addToCart(user_id, product_variant_id);
};

export default { addToCart };
