import { Router } from "express";
import brandController from "../../controllers/brand-controller.js";

const brandRouter = () => {
  // Ignores passed router to avoid shared state pollution
  const router = Router();

  router.get("/", brandController.getAllBrands);
  router.post("/", brandController.createBrand);

  return router;
};

export default brandRouter;
