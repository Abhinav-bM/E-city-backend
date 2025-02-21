import productController from "../../controllers/product-controller.js";

const productRouter = (router) => {
  router.post("/create-product", productController.addProduct);

  router.get("/products", productController.getAllProducts)
  router.get("/:id",productController.getProduct)

  return router;
};

export default productRouter;
