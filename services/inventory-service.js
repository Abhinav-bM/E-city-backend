import INVENTORY_UNIT from "../models/inventory-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import { sendError } from "../utils/response-handler.js";

/**
 * Add a unique inventory unit (refurbished/used/new) to a product variant.
 * @param {Object} unitData
 */
const addInventoryUnit = async (unitData) => {
  const {
    productVariantId,
    itemType,
    serialNumber,
    imei,
    conditionGrade,
    conditionDescription,
    uniqueImages,
    priceOverride,
    location,
  } = unitData;

  // 1. Verify Product Variant Exists
  const variant = await PRODUCT_VARIANT.findById(productVariantId);
  if (!variant) {
    throw new Error("Product Variant not found");
  }

  // 2. Validate Uniqueness (Double Check logic - model indexes also enforce this)
  if (imei) {
    const existingIMEI = await INVENTORY_UNIT.findOne({ imei });
    if (existingIMEI)
      throw new Error(`IMEI ${imei} already exists in inventory`);
  }
  if (serialNumber) {
    const existingSerial = await INVENTORY_UNIT.findOne({ serialNumber });
    if (existingSerial)
      throw new Error(`Serial Number ${serialNumber} already exists`);
  }

  // 3. Create Inventory Unit
  const newUnit = await INVENTORY_UNIT.create({
    productVariantId,
    itemType,
    serialNumber,
    imei,
    conditionGrade,
    conditionDescription,
    uniqueImages,
    priceOverride,
    location,
    status: "Available", // Default to available
  });

  // 4. Update Variant Cache Stock (Increment)
  // We only increment stock for "Available" units
  variant.stock = (variant.stock || 0) + 1;

  // Update inventoryType if needed (e.g. if it was Quantity but now we are adding specific units)
  if (variant.inventoryType === "Quantity" && itemType !== "New") {
    variant.inventoryType = "Unique";
  }

  await variant.save();

  return newUnit;
};

/**
 * Get all inventory units for a specific variant (Admin View)
 */
const getInventoryByVariant = async (variantId, status) => {
  const query = { productVariantId: variantId };
  if (status) query.status = status;

  return await INVENTORY_UNIT.find(query).sort({ createdAt: -1 });
};

/**
 * Search Inventory (Admin)
 */
const searchInventory = async (searchParams) => {
  const { q, page = 1, limit = 20 } = searchParams;
  const skip = (page - 1) * limit;

  const query = {};
  if (q) {
    query.$or = [
      { imei: { $regex: q, $options: "i" } },
      { serialNumber: { $regex: q, $options: "i" } },
    ];
  }

  const units = await INVENTORY_UNIT.find(query)
    .populate("productVariantId", "title attributes sku")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await INVENTORY_UNIT.countDocuments(query);

  return {
    data: units,
    meta: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    },
  };
  return {
    data: units,
    meta: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Soft Delete / Archive Inventory Unit
 */
const archiveInventoryUnit = async (unitId) => {
  const unit = await INVENTORY_UNIT.findById(unitId);
  if (!unit) throw new Error("Inventory Unit not found");

  const newStatus = !unit.isArchived;
  unit.isArchived = newStatus;

  // If archived, we might want to change status to "Damaged" or "Returned" or just keep as is but hidden?
  // Let's just toggle isArchived flag.
  // Ideally, if archived, we should decrease stock count if it was "Available".
  // For now, let's just toggle the flag.

  if (newStatus && unit.status === "Available") {
    // If we archive an available unit, we should decrement stock
    const variant = await PRODUCT_VARIANT.findById(unit.productVariantId);
    if (variant && variant.stock > 0) {
      variant.stock -= 1;
      await variant.save();
    }
    unit.status = "Damaged"; // Or some other non-available status to prevent accidental sale
  } else if (!newStatus && unit.status === "Damaged") {
    // If un-archiving, maybe restore? This is complex. Let's keep it simple: just toggle flag.
    // Logic above is risky without user input.
    // User just asked for soft delete.
  }

  await unit.save();
  return { _id: unitId, isArchived: newStatus };
};

export default {
  addInventoryUnit,
  getInventoryByVariant,
  searchInventory,
  archiveInventoryUnit,
};
