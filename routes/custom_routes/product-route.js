import productController from "../../controllers/product-controller.js";

const productRouter = (router) => {
  router.get("/create-product", productController.addProduct);

  return router;
};

export default productRouter;
