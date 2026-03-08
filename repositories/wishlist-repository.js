import { WISHLIST } from "../models/wishlist-model.js";
import { BASE_PRODUCT, PRODUCT_VARIANT } from "../models/product-model.js";

// Add product to wishlist
const addToWishlist = async (userId, variantId) => {
  const wishlistItem = new WISHLIST({
    userId,
    variantId,
  });

  const savedItem = await wishlistItem.save();
  return savedItem;
};

// Remove product from wishlist
const removeFromWishlist = async (userId, variantId) => {
  const result = await WISHLIST.findOneAndDelete({ userId, variantId });
  return result;
};

// Get user wishlist
const getWishlist = async (userId) => {
  const results = await WISHLIST.find({ userId })
    .populate({
      path: "variantId",
      select:
        "title sellingPrice actualPrice slug images stock condition isNewArrival isOnSale discount attributes baseProductId",
    })
    .sort({ createdAt: -1 })
    .lean();

  // For each wishlist item, fetch the base product to get the category and brand if needed
  // We already populated variantId.
  for (let item of results) {
    if (item.variantId && item.variantId.baseProductId) {
      const baseProduct = await BASE_PRODUCT.findById(
        item.variantId.baseProductId,
      )
        .populate({ path: "category", select: "name" })
        .select("category brand images")
        .lean();

      if (baseProduct) {
        item.variantId.category = baseProduct.category;
        item.variantId.brand = baseProduct.brand;
        item.variantId.baseImages = baseProduct.images;
      }
    }
  }

  return results;
};

export default { addToWishlist, removeFromWishlist, getWishlist };
