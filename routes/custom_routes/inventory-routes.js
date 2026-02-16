import { Router } from "express";
import {
  addInventoryUnit,
  getVariantInventory,
  listInventory,
  deleteInventoryUnit,
} from "../../controllers/inventory-controller.js";

const inventoryRouter = () => {
  const router = Router();
  // Admin: Add specific unit to a product variant
  router.post("/add", addInventoryUnit);

  // Admin: Get inventory for a specific variant
  router.get("/variant/:variantId", getVariantInventory);

  // Admin: List/Search all inventory
  router.get("/list", listInventory);

  // Admin: Delete/Archive inventory unit
  router.delete("/delete/:id", deleteInventoryUnit);

  return router;
};

export default inventoryRouter;
