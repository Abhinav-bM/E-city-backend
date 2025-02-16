import PRODUCT from "../models/product-model.js";

const createProduct = async (productObj) => {
  const product = await new PRODUCT(productObj).save();
  return product;
};

export default {
  createProduct,
};
