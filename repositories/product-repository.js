import PRODUCT from "../models/product-model.js";

const createProduct = async (productObj) => {
  const product = await new PRODUCT(productObj).save();
  return product;
};

const getAllProducts = async (page, size, filter) => {
  const total = await PRODUCT.countDocuments(filter);
  const products = await PRODUCT.find(filter)
    .skip((page - 1) * size)
    .limit(size);

  const data = { products, total };

  return data;
};

const getProduct = async (product_id) => {
  const product = await PRODUCT.findById(product_id);
  return product;
};

const editProduct = async (product_id, update_data) => {
  const updated_product = await PRODUCT.findByIdAndUpdate(
    product_id,
    update_data,
    { new: true, overwrite: true }
  );

  return updated_product;
};

export default {
  createProduct,
  getAllProducts,
  getProduct,
  editProduct,
};
