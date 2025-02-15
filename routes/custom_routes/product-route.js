import productController from "../../controllers/product-controller.js";

const productRouter = (router) => {
  // product routes
  router.get("/create-product", productController.addProduct);
};

export default productRouter;
