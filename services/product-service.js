import productRepository from "../repositories/product-repository.js";

const addProduct = async (obj) => {
  return await productRepository.createProduct(obj);
};

const getAllProducts = async (page, size, filter) => {
  return await productRepository.getAllProducts(page, size, filter);
};

const getProduct = async (product_id) => {
  return await productRepository.getProduct(product_id);
};

const editProduct = async (product_id, update_data) => {
  return await productRepository.editProduct(product_id, update_data);
};

export default { addProduct, getAllProducts, getProduct, editProduct };
