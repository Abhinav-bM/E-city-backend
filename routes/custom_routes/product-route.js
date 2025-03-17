import productController from "../../controllers/product-controller.js";

const productRouter = (router) => {
  router.post("/create-product", productController.addProduct);

  router.get("/products", productController.getAllProducts);
  router.get("/:id", productController.getProduct);

  router.patch("/:id", productController.editProduct);

  return router;
};

export default productRouter;
