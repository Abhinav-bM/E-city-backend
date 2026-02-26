import { WISHLIST } from "../models/wishlist-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";

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
  const results = await WISHLIST.find({ userId })
    .populate({
      path: "productId",
      select: "title images.url isNewArrival isOnSale discount attributes",
      populate: {
        path: "category",
        select: "name",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  // For each wishlist item, fetch the default ProductVariant to get the price
  for (let item of results) {
    if (item.productId) {
      const defaultVariant = await PRODUCT_VARIANT.findOne({
        baseProductId: item.productId._id,
        isDefault: true,
      })
        .select("sellingPrice actualPrice")
        .lean();

      if (defaultVariant) {
        item.productId.price = defaultVariant.sellingPrice;
        item.productId.actualPrice = defaultVariant.actualPrice;
      }
    }
  }

  return results;
};

export default { addToWishlist, removeFromWishlist, getWishlist };
