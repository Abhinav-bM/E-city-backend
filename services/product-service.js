import productRepository from "../repositories/product-repository.js";

const addProduct = async (obj) => {
  return await productRepository.createProduct(obj);
};

export default { addProduct };
