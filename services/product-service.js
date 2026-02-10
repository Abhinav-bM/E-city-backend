import productRepository from "../repositories/product-repository.js";
import inventoryRepository from "../repositories/inventory-repository.js";

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
    specifications, // Added: Destructure specifications
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
    specifications, // Added: Save specifications to BaseProduct
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
      sellingPrice: variant.sellingPrice, // Updated to match schema
      actualPrice: variant.actualPrice, // Updated to match schema
      stock: variant.stock,
      sku: variant.sku,
      inventoryType: variant.inventoryType,
      condition: condition,
      conditionDescription: variant.conditionDescription, // Added
      warranty: variant.warranty, // Added
      images: variant.images,
      isDefault: variant.isDefault,
    };

    const newVariant =
      await productRepository.createProductVariant(variantData);
    createdVariants.push(newVariant);

    // --- INVENTORY UNIT CREATION (For Used/Unique Items) ---
    if (variant.inventoryType === "Unique") {
      const inventoryData = {
        productVariantId: newVariant._id,
        itemType: condition === "New" ? "New" : "Refurbished",
        conditionGrade: variant.conditionGrade || "Good",
        conditionDescription: variant.conditionDescription,
        serialNumber: variant.serialNumber,
        imei: variant.imei,
        status: "Available",
      };

      await inventoryRepository.createInventoryUnit(inventoryData);
    }
  }

  return { baseProduct, variants: createdVariants };
};

// Get product details by variantSlug
// Returns the specific variant details plus all available variants for frontend switching
const getProductDetails = async (variantSlug) => {
  return await productRepository.getProductDetailsByVariantSlug(variantSlug);
};

// Get all products for listing (grouped by primary variant attribute)
const getAllProducts = async (
  filters = {},
  page = 1,
  limit = 10,
  userId = null,
  options = {},
) => {
  return await productRepository.getProductsGroupedByVariant(
    filters,
    page,
    limit,
    userId,
    options,
  );
};

// Soft delete product
const deleteProduct = async (id) => {
  return await productRepository.softDeleteProduct(id);
};

// Get product by base product ID (for editing)
const getProductByBaseId = async (baseProductId) => {
  // Fetch the base product and all variants
  const baseProduct = await productRepository.getBaseProductById(baseProductId);

  if (!baseProduct) {
    throw new Error("Base product not found");
  }

  // Get all variants for this base product
  const variants =
    await productRepository.getVariantsByBaseProductId(baseProductId);

  // Return structured data for editing
  return {
    baseProduct,
    availableVariants: variants,
    currentVariant: variants.find((v) => v.isDefault) || variants[0] || null,
  };
};

const updateProduct = async (id, productData) => {
  const {
    name,
    brand,
    description,
    category,
    variantAttributes,
    variants,
    images,
    isActive,
    isFeatured, // Added
    isNewArrival, // Added
    specifications, // Added
  } = productData;

  // 1. Update Base Product
  const baseProductUpdate = {
    title: name,
    brand,
    description,
    category,
    variantAttributes,
    images,
    isActive: isActive !== undefined ? isActive : true,
    isFeatured, // Added
    isNewArrival, // Added
    specifications, // Added
  };

  const updatedBaseProduct = await productRepository.updateBaseProduct(
    id,
    baseProductUpdate,
  );

  if (!updatedBaseProduct) {
    throw new Error("Product not found");
  }

  // 2. Fetch existing variants to compare
  const existingVariants =
    await productRepository.getVariantsByBaseProductId(id);

  // 3. Process Variants
  const processedVariantIds = new Set();
  const updatedVariants = [];

  const variantsToProcess = variants || [];

  for (const variantData of variantsToProcess) {
    let match = null;

    // Try to find matching existing variant
    // Strategy 1: Match by ID if provided (frontend doesn't send it currently, but good for future)
    if (variantData._id) {
      match = existingVariants.find(
        (v) => v._id.toString() === variantData._id,
      );
    }

    // Strategy 2: Match by SKU (if valid SKU)
    if (!match && variantData.sku) {
      match = existingVariants.find((v) => v.sku === variantData.sku);
    }

    // Strategy 3: Match by Attributes (Exact match)
    if (!match && variantData.attributes) {
      match = existingVariants.find((v) => {
        // Compare attributes objects
        const vAttrs = v.attributes;
        const newAttrs = variantData.attributes;

        // Should have same number of keys
        if (Object.keys(vAttrs).length !== Object.keys(newAttrs).length)
          return false;

        // All keys and values must match
        return Object.keys(newAttrs).every(
          (key) => vAttrs[key] === newAttrs[key],
        );
      });
    }

    if (match) {
      // --- UPDATE EXISTING VARIANT ---
      processedVariantIds.add(match._id.toString());

      const updatePayload = {
        title: variantData.title || match.title, // Keep existing title if not provided (though usually derived)
        // attributes: variantData.attributes // Generally we don't update attributes of existing variant, we create new one?
        // Actually if we matched by attributes, they are same. If matched by SKU, they might differ.
        // Let's allow updating non-identifying fields easily.
        sellingPrice: variantData.sellingPrice,
        actualPrice: variantData.actualPrice,
        stock: variantData.stock,
        sku: variantData.sku,
        condition: variantData.condition || match.condition,
        conditionDescription: variantData.conditionDescription, // Added
        warranty: variantData.warranty, // Added
        images: variantData.images, // Replace images?
        isDefault: variantData.isDefault,
        isActive: true, // Ensure it's active if it was sent in payload
      };

      // Regenerate slug if needed? repository hook handles it if title changes?
      // We defined slug generation in schema pre-save. using findByIdAndUpdate might bypass it unless we use doc.save()
      // But for speed we use findByIdAndUpdate.

      const updatedVariant = await productRepository.updateProductVariant(
        match._id,
        updatePayload,
      );
      updatedVariants.push(updatedVariant);

      // Update Inventory Unit if Unique
      if (updatedVariant.inventoryType === "Unique") {
        const inventoryUnit = await inventoryRepository.getInventoryByVariantId(
          updatedVariant._id,
        );
        // getInventoryByVariantId returns array. Unique items should have 1 unit linked usually
        // or we might need to find the specific unit.
        // For now, assume single unit per Unique variant logic from addProduct.

        if (inventoryUnit && inventoryUnit.length > 0) {
          const unit = inventoryUnit[0]; // Take first
          await inventoryRepository.updateInventoryUnit(unit._id, {
            imei: variantData.imei,
            serialNumber: variantData.serialNumber,
            conditionGrade: variantData.conditionGrade,
            conditionDescription: variantData.conditionDescription,
            priceOverride: variantData.sellingPrice,
          });
        } else {
          // Create if missing (edge case)
          const inventoryData = {
            productVariantId: updatedVariant._id,
            itemType:
              updatedVariant.condition === "New" ? "New" : "Refurbished",
            conditionGrade: variantData.conditionGrade || "Good",
            conditionDescription: variantData.conditionDescription,
            serialNumber: variantData.serialNumber,
            imei: variantData.imei,
            status: "Available",
          };
          await inventoryRepository.createInventoryUnit(inventoryData);
        }
      }
    } else {
      // --- CREATE NEW VARIANT ---
      const newVariantData = {
        baseProductId: id,
        title: name, // or specific variant title logic
        attributes: variantData.attributes,
        sellingPrice: variantData.sellingPrice,
        actualPrice: variantData.actualPrice,
        stock: variantData.stock,
        sku: variantData.sku,
        inventoryType: variantData.inventoryType,
        condition: variantData.condition || "New",
        conditionDescription: variantData.conditionDescription, // Added
        warranty: variantData.warranty, // Added
        images: variantData.images,
        isDefault: variantData.isDefault,
      };

      const newVariant =
        await productRepository.createProductVariant(newVariantData);
      updatedVariants.push(newVariant);
      processedVariantIds.add(newVariant._id.toString());

      // Inventory for new unique variant
      if (newVariant.inventoryType === "Unique") {
        const inventoryData = {
          productVariantId: newVariant._id,
          itemType: newVariant.condition === "New" ? "New" : "Refurbished",
          conditionGrade: variantData.conditionGrade || "Good",
          conditionDescription: variantData.conditionDescription,
          serialNumber: variantData.serialNumber,
          imei: variantData.imei,
          status: "Available",
        };
        await inventoryRepository.createInventoryUnit(inventoryData);
      }
    }
  }

  // 4. Soft Delete / Deactivate missing variants
  // Only if variants were provided in the update payload, otherwise we assume we are just updating base product fields
  if (variants && variants.length > 0) {
    for (const existing of existingVariants) {
      if (!processedVariantIds.has(existing._id.toString())) {
        await productRepository.updateProductVariant(existing._id, {
          isActive: false,
        });
      }
    }
  }

  return { baseProduct: updatedBaseProduct, variants: updatedVariants };
};

export default {
  addProduct,
  getProductDetails,
  getAllProducts,
  deleteProduct,
  deleteProduct,
  getProductByBaseId,
  updateProduct,
};
