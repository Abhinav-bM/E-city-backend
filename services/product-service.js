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

    // Generate a title that includes the variant attributes

    // const attributesValues = Object.values(variant.attributes).join(" / ");
    // const variantTitle = `${name}`;

    const variantData = {
      baseProductId: baseProduct._id,
      title: name,
      attributes: variant.attributes,
      sellingPrice: variant.price,
      actualPrice: productData?.actualPrice || 0,
      images: variant.images,
      stock: variant.stock,
      sku: variant.sku,
      isDefault: i === 0, // Setting the frist variant as default one
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
    limit
  );
};

export default {
  addProduct,
  getProductDetails,
  getAllProducts,
};
