import productRepository from "../repositories/product-repository.js";

const addProduct = async (productData) => {
  // Create the base product
  const { name, brand, description, category, variantAttributes, variants } =
    productData;

  const baseProductData = {
    name,
    brand,
    description,
    category,
    variantAttributes,
  };

  const baseProduct =
    await productRepository.createBaseProduct(baseProductData);

  // Create each variant as a separate product
  const createdVariants = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];

    // Generate a title that includes the variant attributes
    const attributesValues = Object.values(variant.attributes).join(" / ");
    const variantTitle = `${name} - ${attributesValues}`;

    const variantData = {
      baseProductId: baseProduct._id,
      title: variantTitle,
      attributes: variant.attributes,
      price: variant.price,
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

// Get product details with all variants
const getProductDetails = async (baseProductId) => {
  return await productRepository.getBaseProductWithVariants(baseProductId);
};

// Get all products for listing
const getAllProducts = async (filters = {}, page = 1, limit = 10) => {
  return await productRepository.getAllBaseProducts(filters, page, limit);
};

export default {
  addProduct,
  getProductDetails,
  getAllProducts,
};
