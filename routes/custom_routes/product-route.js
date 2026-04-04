/*
 * Auth guards applied:
 * - Public: GET / (listing) and GET /:slug (product detail)
 * - Admin-only: POST (add), PUT (update), DELETE (delete)
 */

import express, { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getProductDetails,
  deleteProduct,
  getProductByBaseId,
  updateProduct,
} from "../../controllers/product-controller.js";
import { requireAdminAuth } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const productRouter = () => {
  const router = Router();

  // ── Public GET routes ─────────────────────────────────────────────────────
  router.get("/", getAllProducts);
  router.get("/base/:id", validateObjectId(), getProductByBaseId);
  router.get("/:slug", getProductDetails);

  // ── Admin-only mutation routes ────────────────────────────────────────────
  router.post(
    "/",
    requireAdminAuth,
    express.json({ limit: "2mb" }),
    addProduct,
  );
  router.put(
    "/:id",
    requireAdminAuth,
    validateObjectId(),
    express.json({ limit: "2mb" }),
    updateProduct,
  );
  router.delete("/:id", requireAdminAuth, validateObjectId(), deleteProduct);

  return router;
};

export default productRouter;
