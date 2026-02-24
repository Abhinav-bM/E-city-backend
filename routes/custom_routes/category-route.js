import { Router } from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../controllers/category-controller.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const categoryRouter = () => {
  const router = Router();
  router.get("/", getCategories); // public
  router.post("/", requireAuth, requireAdmin, createCategory);
  router.put(
    "/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    updateCategory,
  );
  router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    deleteCategory,
  );

  return router;
};

export default categoryRouter;
