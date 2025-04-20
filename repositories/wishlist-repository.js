import { WISHLIST } from "../models/wishlist-model.js";

// Add product to wishlist
const addToWishlist = async (userId, productId) => {
  const wishlistItem = new WISHLIST({
    userId,
    productId,
  });

  const savedItem = await wishlistItem.save();
  return savedItem;
};

// Remove product from wishlist
const removeFromWishlist = async (userId, productId) => {
  const result = await WISHLIST.findByIdAndDelete({ userId, productId });
  return result;
};

export default { addToWishlist, removeFromWishlist };