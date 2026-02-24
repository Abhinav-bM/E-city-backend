/*
 * Auth guards applied:
 * - Public: GET / (listing) and GET /:slug (product detail)
 * - Admin-only: POST (add), PUT (update), DELETE (delete)
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
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const productRouter = () => {
  const router = Router();

  // ── Public GET routes ─────────────────────────────────────────────────────
  router.get("/", getAllProducts);
  router.get("/base/:id", validateObjectId(), getProductByBaseId);
  router.get("/:slug", getProductDetails);

  // ── Admin-only mutation routes ────────────────────────────────────────────
  router.post("/", requireAuth, requireAdmin, addProduct);
  router.put(
    "/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    updateProduct,
  );
  router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    deleteProduct,
  );

  return router;
};

export default productRouter;
