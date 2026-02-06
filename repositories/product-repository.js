import { BASE_PRODUCT, PRODUCT_VARIANT } from "../models/product-model.js";
import { WISHLIST } from "../models/wishlist-model.js";

// Create base product
const createBaseProduct = async (baseProductObj) => {
  const baseProduct = await new BASE_PRODUCT(baseProductObj).save();
  return baseProduct;
};

// Create product variant
const createProductVariant = async (variantObj) => {
  const productVariant = await new PRODUCT_VARIANT(variantObj).save();
  return productVariant;
};

// Get base product with all its variants (by baseProductId)
const getBaseProductWithVariants = async (baseProductId) => {
  console.log(baseProductId);
  const baseProductDoc = await BASE_PRODUCT.findById(baseProductId);
  // .lean();
  const variants = await PRODUCT_VARIANT.find({ baseProductId });

  const defaultVariant = variants.find((v) => v.isDefault);
  // .lean();

  console.log(baseProductDoc?.images);

  const basicDatas = {
    price: defaultVariant?.price || 0,
    images: baseProductDoc?.images,
  };

  const baseProduct = baseProductDoc?.toObject();

  const product = {
    ...baseProduct,
    ...basicDatas,
    variants: variants.map((v) => v.toObject()),
  };

  return product;
};

// Get product details by variantSlug - returns specific variant with all available variants for switching
// This is optimized for frontend variant management (e.g., color/size selectors)
const getProductDetailsByVariantSlug = async (variantSlug) => {
  // Find the specific variant by slug
  // This will tell us which base product it belongs to
  const currentVariant = await PRODUCT_VARIANT.findOne({
    slug: variantSlug,
  }).lean();

  // If variant doesn't exist, throw error
  if (!currentVariant) {
    throw new Error("Variant not found");
  }

  // Step 2: Get the base product ID from the variant
  const baseProductId = currentVariant.baseProductId;

  // Step 3: Fetch the base product and all its variants in parallel for better performance
  const [baseProductDoc, allVariants] = await Promise.all([
    BASE_PRODUCT.findById(baseProductId).lean(),
    PRODUCT_VARIANT.find({ baseProductId }).lean(),
  ]);

  // If base product doesn't exist, throw error
  if (!baseProductDoc) {
    throw new Error("Base product not found");
  }

  // Step 4: Determine primary attribute for grouping (same logic as getProductsGroupedByVariant)
  // This helps frontend understand which attribute to use for variant selection UI
  const getPrimaryAttributeKey = (baseProduct) => {
    if (
      !baseProduct?.variantAttributes ||
      baseProduct.variantAttributes.length === 0
    ) {
      return null;
    }

    // Priority: Color first, then first attribute
    const colorAttr = baseProduct.variantAttributes.find(
      (attr) => attr.name?.toLowerCase() === "color",
    );
    if (colorAttr) {
      return colorAttr.name;
    }

    return baseProduct.variantAttributes[0]?.name || null;
  };

  const primaryAttributeKey = getPrimaryAttributeKey(baseProductDoc);

  // Step 5: Determine which images to use for current variant
  // Priority: variant images if available, otherwise base product images
  const variantImages =
    currentVariant.images && currentVariant.images.length > 0
      ? currentVariant.images
      : baseProductDoc?.images || [];

  // Step 6: Build variant options map for easy frontend switching
  // Groups variants by their attribute combinations for easy selection
  const variantOptions = allVariants.map((variant) => ({
    variantId: variant._id,
    attributes: variant.attributes,
    price: variant.sellingPrice,
    compareAtPrice: variant.compareAtPrice,
    stock: variant.stock,
    sku: variant.sku,
    slug: variant.slug,
    images:
      variant.images && variant.images.length > 0
        ? variant.images
        : baseProductDoc?.images || [],
    isAvailable: variant.stock > 0,
    isDefault: variant.isDefault,
  }));

  // Step 7: Build the response structure optimized for frontend variant management
  return {
    // Current variant details (the one requested)
    currentVariant: {
      variantId: currentVariant._id,
      title: currentVariant.title,
      attributes: currentVariant.attributes,
      price: currentVariant.sellingPrice,
      compareAtPrice: currentVariant.compareAtPrice,
      stock: currentVariant.stock,
      sku: currentVariant.sku,
      slug: currentVariant.slug,
      weight: currentVariant.weight,
      dimensions: currentVariant.dimensions,
      images: variantImages,
      isDefault: currentVariant.isDefault,
      isAvailable: currentVariant.stock > 0,
    },

    // Base product information (shared across all variants)
    baseProduct: {
      baseProductId: baseProductDoc._id,
      name: baseProductDoc.title,
      brand: baseProductDoc.brand,
      description: baseProductDoc.description,
      category: baseProductDoc.category,
      baseImages: baseProductDoc.images || [], // Base images as fallback
      variantAttributes: baseProductDoc.variantAttributes || [], // Available attributes (Color, Size, etc.)
      createdAt: baseProductDoc.createdAt,
    },

    // All available variants for this base product (for variant selector/switcher)
    availableVariants: variantOptions,

    // Metadata to help frontend build variant selection UI
    variantMetadata: {
      primaryAttributeKey: primaryAttributeKey, // Which attribute is primary (e.g., "Color")
      totalVariants: allVariants.length, // Total number of variants
      availableCount: allVariants.filter((v) => v.stock > 0).length, // How many are in stock
    },
  };
};

/*
 * Get all products grouped by primary variant attribute (e.g., Color)
 * Returns one product per unique primary attribute value (e.g., one per color)
 * Uses variant images if available, otherwise falls back to base product images
 */
const getProductsGroupedByVariant = async (
  filters = {},
  page = 1,
  limit = 10,
  userId = null,
  options = {},
) => {
  // Calculate how many items to skip for pagination (e.g., page 2 with limit 10 = skip 10)
  const skip = (page - 1) * limit;

  // Find all base products matching the provided filters (category, brand, etc.)
  // .lean() returns plain JavaScript objects instead of Mongoose documents for better performance
  // .select() only fetches the fields we need, reducing data transfer
  const baseProductDocs = await BASE_PRODUCT.find(filters)
    .select("_id name brand description category images variantAttributes")
    .lean();

  // Extract just the IDs from base products to use in subsequent queries
  const baseProductIdList = baseProductDocs.map((b) => b._id);

  // Return if no base products match the filters (saves unnecessary database queries)
  if (baseProductIdList.length === 0) {
    return {
      products: [],
      pagination: { total: 0, page, limit, pages: 0 },
    };
  }

  // Get wishlist product IDs for lookup (to mark products as wishlisted)
  let wishlistedProductIds = [];
  if (userId) {
    // Find all wishlist entries where the productId matches any of our base products
    const wishlistedItems = await WISHLIST.find({
      userId,
      productId: { $in: baseProductIdList }, // $in is MongoDB operator for "match any of these values"
    })
      .select("productId") // Only select productId field
      .lean();

    // Convert to array of strings for easy comparison later
    wishlistedProductIds = wishlistedItems.map((item) =>
      item.productId.toString(),
    );
  }

  // Fetch ALL variants for the matching base products (not paginated yet)
  // We need all variants to group them properly
  const variantQuery = {
    baseProductId: { $in: baseProductIdList }, // Match any base product in our list
    ...(options.variantFilters || {}), // Merge any additional variant filters from options
  };

  // Determine sort order (default: newest first)
  const sortOption = options.sort || { createdAt: -1 };

  // Fetch all variants matching our query (no pagination here - we'll paginate after grouping)
  const variantDocs = await PRODUCT_VARIANT.find(variantQuery)
    .sort(sortOption)
    .lean();

  // Build a lookup map for base product fields
  // Map allows O(1) lookup time instead of O(n) array search
  // Key: base product ID as string, Value: base product object
  const baseById = new Map(baseProductDocs.map((b) => [b._id.toString(), b]));

  // Determine the primary attribute for grouping (e.g., "Color")
  // This is the attribute we'll use to group variants (e.g., group by color value)
  // Priority: 1) "Color" or "color" (case-insensitive), 2) First attribute in variantAttributes
  const getPrimaryAttributeKey = (baseProduct) => {
    // Check if base product has variantAttributes defined
    if (
      !baseProduct?.variantAttributes ||
      baseProduct.variantAttributes.length === 0
    ) {
      return null;
    }

    // First, try to find "Color" or "color" (case-insensitive)
    const colorAttr = baseProduct.variantAttributes.find(
      (attr) => attr.name?.toLowerCase() === "color",
    );
    if (colorAttr) {
      return colorAttr.name; // Return the actual name (preserves casing)
    }

    // If no color attribute, use the first attribute as primary
    return baseProduct.variantAttributes[0]?.name || null;
  };

  // Group variants by baseProductId + primaryAttributeValue
  // This creates a Map where:
  // Key: "baseProductId_primaryAttributeValue" (e.g., "123_Red")
  // Value: Array of variants with that baseProductId and primary attribute value
  const variantGroups = new Map();

  variantDocs.forEach((variant) => {
    // Get the base product for this variant
    const base = baseById.get(variant.baseProductId.toString());
    if (!base) return; // Skip if base product not found (shouldn't happen)

    // Determine which attribute to use for grouping
    const primaryAttrKey = getPrimaryAttributeKey(base);

    // Get the value of the primary attribute from this variant
    // variant.attributes is an object like { Color: "Red", Size: "M" }
    let groupKey;
    if (primaryAttrKey && variant.attributes?.[primaryAttrKey]) {
      // Group by baseProductId + primary attribute value
      const primaryValue = variant.attributes[primaryAttrKey];
      groupKey = `${variant.baseProductId.toString()}_${primaryValue}`;
    } else {
      // If no primary attribute found, each variant is its own group
      groupKey = `${variant.baseProductId.toString()}_${variant._id.toString()}`;
    }

    // Add variant to its group (create array if group doesn't exist)
    if (!variantGroups.has(groupKey)) {
      variantGroups.set(groupKey, []);
    }
    variantGroups.get(groupKey).push({
      variant,
      base,
      primaryAttrKey,
    });
  });

  // Select the best variant from each group
  // For each group, we want to pick one "representative" variant
  // Priority: 1) Default variant, 2) First variant in the group
  const groupedProducts = Array.from(variantGroups.values()).map((group) => {
    // Sort group: default variants first, then by creation date
    group.sort((a, b) => {
      // If one is default and other isn't, default comes first
      if (a.variant.isDefault && !b.variant.isDefault) return -1;
      if (!a.variant.isDefault && b.variant.isDefault) return 1;
      // If both have same default status, maintain original order
      return 0;
    });

    // Pick the first (best) variant from the sorted group
    const { variant, base, primaryAttrKey } = group[0];

    // Determine which images to use
    // Priority: variant images if they exist and are not empty, otherwise base product images
    const variantImages =
      variant.images && variant.images.length > 0
        ? variant.images
        : base?.images || [];

    // Check if this base product is wishlisted
    const isWishlisted = userId
      ? wishlistedProductIds.includes(variant.baseProductId.toString())
      : false;

    // Return the product object with merged base and variant data
    return {
      // Base product fields (shared across all variants)
      // baseProductId: variant.baseProductId,
      // name: base?.name,
      // brand: base?.brand,
      // description: base?.description,
      // category: base?.category,
      // baseCreatedAt: base?.createdAt,

      // Variant-specific fields (from the selected representative variant)
      // variantId: variant._id,
      title: variant.title,
      attributes: variant.attributes,
      sellingPrice: variant.sellingPrice,
      actualPrice: variant?.actualPrice || 0,
      slug: variant?.slug,
      // compareAtPrice: variant.compareAtPrice,
      // Use variant images if available, otherwise fall back to base images
      images: variantImages,
      stock: variant.stock,
      // sku: variant.sku,
      // weight: variant.weight,
      // dimensions: variant.dimensions,
      // isDefault: variant.isDefault,

      // Additional metadata
      // primaryAttributeKey: primaryAttrKey, // Which attribute was used for grouping
      // variantCountInGroup: group.length, // How many variants share this primary attribute value
      // is_wishlisted: isWishlisted,
      isActive: base?.isActive, // Ensure soft-delete status is visible to admin
    };
  });

  // Apply pagination to the grouped results
  // Now that we have grouped products, we can paginate them
  const totalGroupedProducts = groupedProducts.length;
  const paginatedProducts = groupedProducts.slice(skip, skip + limit);

  return {
    products: paginatedProducts,
    pagination: {
      total: totalGroupedProducts, // Total number of unique groups (not total variants)
      page,
      limit,
      pages: Math.ceil(totalGroupedProducts / limit), // Calculate total pages
    },
  };
}; // Soft delete product (toggle isActive)
const softDeleteProduct = async (id) => {
  // We should toggle both BaseProduct and its variants?
  // Or just BaseProduct? If BaseProduct is inactive, variants should be hidden.
  // Let's toggle BaseProduct.

  const baseProduct = await BASE_PRODUCT.findById(id);
  if (!baseProduct) {
    throw new Error("Product not found");
  }

  const newStatus = !baseProduct.isActive;
  baseProduct.isActive = newStatus;
  await baseProduct.save();

  // Optionally toggle all variants too to be safe/consistent
  await PRODUCT_VARIANT.updateMany(
    { baseProductId: id },
    { $set: { isActive: newStatus } }, // Note: Variant schema needs this field if we want to query variants directly
  );

  return { _id: id, isActive: newStatus };
};

export default {
  createBaseProduct,
  createProductVariant,
  getBaseProductWithVariants,
  getProductDetailsByVariantSlug,
  getProductsGroupedByVariant,
  softDeleteProduct,
};
