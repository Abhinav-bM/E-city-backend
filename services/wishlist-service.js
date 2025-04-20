import wishlistRepository from "../repositories/wishlist-repository.js";

// Add a product to wishlist
const addToWishlist = async (userId, productId) => {
  return await wishlistRepository.addToWishlist(userId, productId);
};

// Remove a product from wishlist
const removeFromWishlist = async (userId, productId) => {
  return await wishlistRepository.removeFromWishlist(userId, productId);
};

export default { addToWishlist, removeFromWishlist };
