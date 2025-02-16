import productRepository from "../repositories/product-repository.js";

const addProduct = async (obj) => {
  productRepository.createProduct(obj);
};

export default { addProduct };
