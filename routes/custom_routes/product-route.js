import {
  addProduct,
  getAllProducts,
  getProductDetails,
} from "../../controllers/product-controller.js";

const productRouter = (router) => {
  router.post("/create-product", addProduct);
  router.get("/all", getAllProducts);
  router.get("/:id", getProductDetails);
  // router.patch("/:id", editProduct);

  return router;
};

export default productRouter;
