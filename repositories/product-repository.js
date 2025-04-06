import { BASE_PRODUCT, PRODUCT_VARIANT } from "../models/product-model.js";

// Create base product
const createBaseProduct = async (baseProductObj) => {
  const baseProduct = await new BASE_PRODUCT(baseProductObj).save();
  return baseProduct;
};

// Create product variant
const createProductVariant = async (variantObj) => {
  const productVariant = await new PRODUCT_VARIANT(variantObj).save();
};

// Get base product with all its variants
const getBaseProductWithVariants = async (baseProductId) => {
  const baseProductDoc = await BASE_PRODUCT.findById(baseProductId);
  const variants = await PRODUCT_VARIANT.find({ baseProductId });

  const defaultVariant = variants.find((v) => v.isDefault);

  const basicDatas = {
    price: defaultVariant?.price || 0,
    images: defaultVariant?.images || [],
  };

  const baseProduct = baseProductDoc.toObject(); // 🔥 This is the fix

  const product = {
    ...baseProduct,
    ...basicDatas,
    variants: variants.map((v) => v.toObject()),
  };

  return product;
};

// Ger all base products (for listing page)
const getAllBaseProducts = async (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const baseProducts = await BASE_PRODUCT.find(filters)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get default variant for each base product
  const productWithDefaultVariant = await Promise.all(
    baseProducts.map(async (baseProduct) => {
      const defaultVariant = await PRODUCT_VARIANT.findOne({
        baseProductId: baseProduct._id,
        isDefault: true,
      });

      return {
        ...baseProduct.toObject(),
        defaultVariant: defaultVariant ? defaultVariant.toObject() : null,
      };
    })
  );

  const total = await BASE_PRODUCT.countDocuments(filters);

  return {
    products: productWithDefaultVariant,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// Get specific product variant
const getProductVariant = async (variantId) => {
  return await PRODUCT_VARIANT.findById(variantId);
};

// Get all variants for base product
const getVariantsByBaseProductId = async (baseProductId) => {
  return await PRODUCT_VARIANT.find({ baseProductId });
};

// Update base product
const updateBaseProduct = async (baseProductId, updateData) => {
  return await BASE_PRODUCT.findByIdAndUpdate(baseProductId, updateData, {
    new: true,
  });
};

// Update product variant
const updateProductVariant = async (variantId, updateData) => {
  return await PRODUCT_VARIANT.findByIdAndUpdate(variantId, updateData, {
    new: true,
  });
};

export default {
  createBaseProduct,
  createProductVariant,
  getBaseProductWithVariants,
  getAllBaseProducts,
  getProductVariant,
  getVariantsByBaseProductId,
  updateBaseProduct,
  updateProductVariant,
};
