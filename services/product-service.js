import productRepository from "../repositories/product-repository.js";

const addProduct = async (obj) => {
  return await productRepository.createProduct(obj);
};

const getAllProducts = async () => {
  return await productRepository.getAllProducts();
};

const getProduct = async (product_id) => {
  return await productRepository.getProduct(product_id);
};

export default { addProduct, getAllProducts, getProduct };
