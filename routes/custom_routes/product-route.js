/*
 * PENDING
 * Add authentication in admin side
 * Product edit option
*/

import {
  addProduct,
  getAllProducts,
  getProductDetails,
} from "../../controllers/product-controller.js";



const productRouter = (router) => {
  // admin rountes
  router.post("/create-product", addProduct);

  // store front routes
  router.get("/all", getAllProducts);
  router.get("/:slug", getProductDetails);

  return router;
};

export default productRouter;
