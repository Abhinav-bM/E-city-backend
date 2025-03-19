import {
  addProduct,
  getProduct,
  editProduct,
  getAllProducts,
} from "../../controllers/product-controller.js";
const productRouter = (router) => {
  
  router.post("/create-product", addProduct);
  router.get("/products", getAllProducts);
  router.get("/:id", getProduct);
  router.patch("/:id", editProduct);

  return router;
};

export default productRouter;
