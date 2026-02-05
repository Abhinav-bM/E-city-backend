import productRepository from "../repositories/product-repository.js";

const addProduct = async (productData) => {
  // Create the base product
  const {
    name,
    brand,
    description,
    category,
    variantAttributes,
    variants,
    images,
  } = productData;

  // --- VALIDATION START ---
  // Ensure all variants strictly adhere to the base product's attribute definitions
  if (variants && variants.length > 0) {
    const attributeNames = variantAttributes.map((attr) => attr.name);
    const seenCombinations = new Set();

    variants.forEach((variant) => {
      // 1. Check for missing or extra attributes
      const variantKeys = Object.keys(variant.attributes);

      // Check if all required attributes are present
      const missingAttributes = attributeNames.filter(
        (name) => !variantKeys.includes(name),
      );
      if (missingAttributes.length > 0) {
        throw new Error(
          `Variant missing required attributes: ${missingAttributes.join(", ")}`,
        );
      }

      // Check if there are any undefined attributes
      const extraAttributes = variantKeys.filter(
        (key) => !attributeNames.includes(key),
      );
      if (extraAttributes.length > 0) {
        throw new Error(
          `Variant contains undefined attributes: ${extraAttributes.join(", ")}`,
        );
      }

      // 2. Duplicate Check
      // A unique variant is defined by its Attributes + Condition + ConditionDescription (if unique item)
      // For general uniqueness check to prevent accidental duplicates:
      const conditionKey = variant.condition || "New";

      // If it's a unique used item (e.g. specific scratch), we assume the frontend sends a unique conditionDescription or handled by user intent.
      // However, we must ensure we don't have exact same attributes + condition + description overlap if intended to be unique.
      // For simplicity and safety: Check uniqueness based on Attributes + Condition + ConditionDescription

      const uniqueKeyParts = [
        ...Object.entries(variant.attributes)
          .sort(([k1], [k2]) => k1.localeCompare(k2)) // Sort keys for consistent stringify
          .map(([k, v]) => `${k}:${v}`),
        `Condition:${conditionKey}`,
        `Desc:${variant.conditionDescription || ""}`, // Include description in uniqueness to allow "Scratch Top" vs "Scratch Bottom"
      ];

      const uniqueKey = uniqueKeyParts.join("|");

      if (seenCombinations.has(uniqueKey)) {
        throw new Error(
          `Duplicate variant detected: ${JSON.stringify(
            variant.attributes,
          )} with condition ${conditionKey} and description "${variant.conditionDescription || ""}"`,
        );
      }
      seenCombinations.add(uniqueKey);
    });
  }
  // --- VALIDATION END ---

  const baseProductData = {
    title: name,
    brand,
    description,
    category,
    variantAttributes,
    images,
  };

  const baseProduct =
    await productRepository.createBaseProduct(baseProductData);

  // Create each variant as a separate product
  const createdVariants = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];

    // Default to "New" if not specified
    const condition = variant.condition || "New";

    const variantData = {
      baseProductId: baseProduct._id,
      title: name,
      attributes: variant.attributes,
      sellingPrice: variant.price,
      // Map pricing fields from variant level, falling back to product level or 0
      actualPrice: variant.actualPrice || productData?.actualPrice || 0,
      compareAtPrice:
        variant.compareAtPrice || productData?.compareAtPrice || 0,
      images: variant.images,
      stock: variant.stock,
      sku: variant.sku,
      isDefault: i === 0, // Setting the first variant as default one

      // New Fields Mapping
      condition: condition,
      conditionDescription: variant.conditionDescription,
      warranty: variant.warranty,
      metadata: variant.metadata,
    };

    const createdVariant =
      await productRepository.createProductVariant(variantData);
    createdVariants.push(createdVariant);
  }

  return { baseProduct, variants: createdVariants };
};

// Get product details by variantSlug
// Returns the specific variant details plus all available variants for frontend switching
const getProductDetails = async (variantSlug) => {
  return await productRepository.getProductDetailsByVariantSlug(variantSlug);
};

// Get all products for listing (grouped by primary variant attribute)
const getAllProducts = async (filters = {}, page = 1, limit = 10) => {
  return await productRepository.getProductsGroupedByVariant(
    filters,
    page,
    limit,
  );
};

// Soft delete product
const deleteProduct = async (id) => {
  return await productRepository.softDeleteProduct(id);
};

export default {
  addProduct,
  getProductDetails,
  getAllProducts,
  deleteProduct,
};
