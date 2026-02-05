import { Router } from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../controllers/category-controller.js";

const categoryRouter = () => {
  const router = Router();
  router.post("/create", createCategory);
  router.get("/get", getCategories);
  router.put("/update/:id", updateCategory);
  router.delete("/delete/:id", deleteCategory);

  return router;
};

export default categoryRouter;
