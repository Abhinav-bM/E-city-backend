import productServices from "../services/product-service.js";
import ApiResponse from "../utils/api-response.js";

// Create product
const addProduct = async (req, res) => {
  try {
    const obj = req.body;
    const productDetails = await productServices.addProduct(obj);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Product added successfully";
    apiResponse.data = { productDetails };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while creating product : ", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while creating product";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

// Get all product
const getAllProducts = async (req, res) => {
  try {
    let { page = 1, size = 20, category, brand } = req.query;

    page = parseInt(page);
    size = parseInt(size);

    let filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const { products, total } = await productServices.getAllProducts(
      page,
      size,
      filter
    );

    const apiResponse = new ApiResponse();
    apiResponse.message = "Products fetched successfully";
    apiResponse.data = products;
    apiResponse.total = total;
    apiResponse.page = page;
    apiResponse.size = size;
    apiResponse.total_pages = Math.ceil(total / size);
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while fetching products", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching products";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

// Get single product :id
const getProduct = async (req, res) => {
  try {
    const product_id = req.params.id;
    const product = await productServices.getProduct(product_id);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Product fetched successfully";
    apiResponse.data = product;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error while fetching product", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while fetching product";
    apiResponse.statusCode = 500;
    return res.json(apiResponse);
  }
};

// Edit product
const editProduct = async (req, res) => {
  try {
    const product_id = req.params.id;
    const update_data = req.body;
    const updated_product = await productServices.editProduct(
      product_id,
      update_data
    );
    const apiResponse = new ApiResponse();
    apiResponse.message = "Product updated successfully";
    apiResponse.data = updated_product;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    console.error("Error updating product : ", error);
    const apiResponse = new ApiResponse();
    apiResponse.message = "Error while updating product";
    apiResponse.status = 500;
    return res.json(apiResponse);
  }
};

export default { addProduct, getAllProducts, getProduct, editProduct };
