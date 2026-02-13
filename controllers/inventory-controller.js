import inventoryService from "../services/inventory-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Add specific unit
const addInventoryUnit = asyncHandler(async (req, res) => {
  const unit = await inventoryService.addInventoryUnit(req.body);
  return sendResponse(
    res,
    201,
    true,
    "Inventory Unit added successfully",
    unit,
  );
});

// Get units for a variant
const getVariantInventory = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  const { status } = req.query;
  const units = await inventoryService.getInventoryByVariant(variantId, status);
  return sendResponse(res, 200, true, "Inventory retrieved", units);
});

// Search/List Inventory (Admin)
const listInventory = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const result = await inventoryService.searchInventory({ q, page, limit });
  return sendResponse(res, 200, true, "Inventory list retrieved", result);
});

// Soft Delete Inventory Unit
const deleteInventoryUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await inventoryService.archiveInventoryUnit(id);
  return sendResponse(
    res,
    200,
    true,
    `Inventory Unit ${result.isArchived ? "archived" : "restored"} successfully`,
    result,
  );
});

export {
  addInventoryUnit,
  getVariantInventory,
  listInventory,
  deleteInventoryUnit,
};
