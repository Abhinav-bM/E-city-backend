import { Router } from "express";
import {
  addInventoryUnit,
  getVariantInventory,
  listInventory,
  deleteInventoryUnit,
} from "../../controllers/inventory-controller.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const inventoryRouter = () => {
  const router = Router();

  // All inventory routes are admin-only
  router.post("/add", requireAuth, requireAdmin, addInventoryUnit);
  router.get(
    "/variant/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    getVariantInventory,
  );
  router.get("/list", requireAuth, requireAdmin, listInventory);
  router.delete(
    "/delete/:id",
    requireAuth,
    requireAdmin,
    validateObjectId(),
    deleteInventoryUnit,
  );

  return router;
};

export default inventoryRouter;
