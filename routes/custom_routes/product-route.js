import productController from "../../controllers/product-controller.js";

const productRouter = (router) => {
  router.post("/create-product", productController.addProduct);

  return router;
};

export default productRouter;
