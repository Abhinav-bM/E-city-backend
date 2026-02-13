import InventoryUnit from "../models/inventory-model.js";

const createInventoryUnit = async (inventoryData) => {
  const inventoryUnit = await new InventoryUnit(inventoryData).save();
  return inventoryUnit;
};

const getInventoryByVariantId = async (variantId) => {
  return await InventoryUnit.find({ productVariantId: variantId });
};

const updateInventoryUnit = async (id, updateData) => {
  return await InventoryUnit.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteInventoryUnit = async (id) => {
  return await InventoryUnit.findByIdAndDelete(id);
};

export default {
  createInventoryUnit,
  getInventoryByVariantId,
  updateInventoryUnit,
  deleteInventoryUnit,
};
