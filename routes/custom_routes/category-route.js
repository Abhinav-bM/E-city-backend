import { Router } from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../controllers/category-controller.js";
import { requireAdminAuth } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const categoryRouter = () => {
  const router = Router();
  router.get("/", getCategories); // public
  router.post("/", requireAdminAuth, createCategory);
  router.put("/:id", requireAdminAuth, validateObjectId(), updateCategory);
  router.delete("/:id", requireAdminAuth, validateObjectId(), deleteCategory);

  return router;
};

export default categoryRouter;
