import wishlistRepository from "../repositories/wishlist-repository.js";

// Add a product to wishlist
const addToWishlist = async (userId, variantId) => {
  return await wishlistRepository.addToWishlist(userId, variantId);
};

// Remove a product from wishlist
const removeFromWishlist = async (userId, variantId) => {
  return await wishlistRepository.removeFromWishlist(userId, variantId);
};

// Get a user's wishlist
const getWishlist = async (userId) => {
  return await wishlistRepository.getWishlist(userId);
};

export default { addToWishlist, removeFromWishlist, getWishlist };
