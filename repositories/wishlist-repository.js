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
  const result = await WISHLIST.findOneAndDelete({ userId, productId });
  return result;
};

// Get user wishlist
const getWishlist = async (userId) => {
  const result = await WISHLIST.find({ userId })
    .populate({
      path: "productId",
      select:
        "title price images.url isNewArrival isOnSale discount attributes",
      populate: {
        path: "category",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });
  return result;
};

export default { addToWishlist, removeFromWishlist, getWishlist };
