import { Router } from "express";
import brandController from "../../controllers/brand-controller.js";
import { requireAdminAuth } from "../../middlewares/auth.js";

const brandRouter = () => {
  const router = Router();

  router.get("/", brandController.getAllBrands); // public
  router.post("/", requireAdminAuth, brandController.createBrand);

  return router;
};

export default brandRouter;
