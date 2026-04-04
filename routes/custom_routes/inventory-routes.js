import { Router } from "express";
import {
  addInventoryUnit,
  getVariantInventory,
  listInventory,
  deleteInventoryUnit,
} from "../../controllers/inventory-controller.js";
import { requireAdminAuth } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const inventoryRouter = () => {
  const router = Router();

  // All inventory routes are admin-only
  router.post("/add", requireAdminAuth, addInventoryUnit);
  router.get(
    "/variant/:id",
    requireAdminAuth,
    validateObjectId(),
    getVariantInventory,
  );
  router.get("/list", requireAdminAuth, listInventory);
  router.delete(
    "/delete/:id",
    requireAdminAuth,
    validateObjectId(),
    deleteInventoryUnit,
  );

  return router;
};

export default inventoryRouter;
