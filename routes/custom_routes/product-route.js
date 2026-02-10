/*
 * PENDING
 * Add authentication in admin side
 * Product edit option
 */

import { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getProductDetails,
  deleteProduct,
  getProductByBaseId,
  updateProduct,
} from "../../controllers/product-controller.js";

const productRouter = () => {
  const router = Router();

  // GET routes first - most specific to least specific
  router.get("/", getAllProducts); // List all products
  router.get("/base/:id", getProductByBaseId); // Get product by base ID (for editing)
  router.get("/:slug", getProductDetails); // Get specific product by slug

  // POST/DELETE routes
  router.post("/", addProduct);
  router.put("/:id", updateProduct); // Update product
  router.delete("/:id", deleteProduct); // Soft delete endpoint

  return router;
};

export default productRouter;
