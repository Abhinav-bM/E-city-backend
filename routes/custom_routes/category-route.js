import { Router } from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../controllers/category-controller.js";

const categoryRouter = () => {
  const router = Router();
  router.post("/", createCategory);
  router.get("/", getCategories);
  router.put("/:id", updateCategory);
  router.delete("/:id", deleteCategory);

  return router;
};

export default categoryRouter;
