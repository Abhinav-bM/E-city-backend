import ORDER from "../models/order-model.js";
import CART from "../models/cart-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";

/**
 * createOrder — places an order from the user's active cart.
 * Handles inventory deduction (Quantity) and unit reservation (Unique) in Task 5.
 */
const createOrder = async ({
  userId,
  shippingAddress,
  paymentMethod = "COD",
  notes,
}) => {
  // 1. Fetch cart with full population
  const cart = await CART.findOne({ userId }).populate({
    path: "items.productVariantId",
    populate: { path: "baseProductId", select: "title" },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  // 2. Build order items + run stock validation
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const variant = cartItem.productVariantId;
    if (!variant)
      throw new Error("A product in your cart is no longer available.");

    const priceAtOrder = cartItem.priceAtAdd;
    const quantity = cartItem.quantity;

    // ── Quantity-based (New) stock check ─────────────────────────────────────
    if (variant.inventoryType !== "Unique") {
      // Re-fetch to get current stock (cart population uses a ref, may be stale)
      const freshVariant = await PRODUCT_VARIANT.findById(variant._id);
      if (!freshVariant || freshVariant.stock < quantity) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" only has ${freshVariant?.stock ?? 0} units left.`,
        );
      }
      // Deduct stock immediately
      freshVariant.stock -= quantity;
      await freshVariant.save();
    }

    // ── Unique-item stock check + reservation ────────────────────────────────
    let inventoryUnitId = null;
    if (variant.inventoryType === "Unique") {
      const unit = await INVENTORY_UNIT.findOne({
        productVariantId: variant._id,
        status: "Available",
        isArchived: false,
      });
      if (!unit) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" is no longer available.`,
        );
      }
      unit.status = "Reserved";
      unit.orderId = "pending"; // will update after order is saved
      await unit.save();
      inventoryUnitId = unit._id;
    }

    orderItems.push({
      productVariantId: variant._id,
      baseProductId: variant.baseProductId?._id || variant.baseProductId,
      inventoryUnitId,
      quantity,
      priceAtOrder,
      title: variant.baseProductId?.title || "",
      attributes: variant.attributes || {},
    });

    subtotal += priceAtOrder * quantity;
  }

  const shippingFee = 0; // free shipping for now
  const totalAmount = subtotal + shippingFee;

  // 3. Create the order document
  const order = await ORDER.create({
    userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: "Pending",
    orderStatus: "Placed",
    subtotal,
    shippingFee,
    totalAmount,
    notes: notes || "",
  });

  // 4. Update InventoryUnit.orderId to real order ID
  const uniqueUnitIds = orderItems
    .filter((i) => i.inventoryUnitId)
    .map((i) => i.inventoryUnitId);

  if (uniqueUnitIds.length > 0) {
    await INVENTORY_UNIT.updateMany(
      { _id: { $in: uniqueUnitIds } },
      { $set: { orderId: order._id.toString() } },
    );
  }

  // 5. Clear the cart ONLY for COD (Razorpay clears it on successful verification)
  if (paymentMethod !== "Razorpay") {
    await CART.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalItems: 0, subtotal: 0 } },
    );
  }

  return order;
};

/**
 * getOrdersByUser — customer's own order history
 */
const getOrdersByUser = async (userId) => {
  return ORDER.find({ userId })
    .sort({ createdAt: -1 })
    .populate("items.productVariantId", "attributes sellingPrice images")
    .populate("items.baseProductId", "title images")
    .lean();
};

/**
 * getAllOrders — admin: paginated order list with optional status filter
 */
const getAllOrders = async ({ status, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.orderStatus = status;

  const skip = (page - 1) * limit;
  const total = await ORDER.countDocuments(filter);

  const orders = await ORDER.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name phone email")
    .populate("items.baseProductId", "title images")
    .lean();

  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * getOrderById — full single order detail (admin + customer)
 */
const getOrderById = async (orderId) => {
  const order = await ORDER.findById(orderId)
    .populate("userId", "name phone email")
    .populate(
      "items.productVariantId",
      "attributes sellingPrice images inventoryType",
    )
    .populate("items.baseProductId", "title images brand")
    .populate("items.inventoryUnitId", "imei serialNumber conditionGrade")
    .lean();

  if (!order) throw new Error("Order not found.");
  return order;
};

/**
 * updateOrderStatus — admin: move order through lifecycle
 * Also marks InventoryUnit as Sold on Delivered, and reverts on Cancel.
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await ORDER.findById(orderId);
  if (!order) throw new Error("Order not found.");

  const prevStatus = order.orderStatus;
  order.orderStatus = newStatus;

  // Payment: COD orders become "Paid" on Delivered
  if (newStatus === "Delivered" && order.paymentMethod === "COD") {
    order.paymentStatus = "Paid";
  }

  await order.save();

  // Side effects on InventoryUnits
  const uniqueUnitIds = order.items
    .filter((i) => i.inventoryUnitId)
    .map((i) => i.inventoryUnitId);

  if (uniqueUnitIds.length > 0) {
    if (newStatus === "Delivered") {
      await INVENTORY_UNIT.updateMany(
        { _id: { $in: uniqueUnitIds } },
        { $set: { status: "Sold", soldDate: new Date() } },
      );
    } else if (newStatus === "Cancelled" && prevStatus !== "Delivered") {
      // Revert unique unit back to available
      await INVENTORY_UNIT.updateMany(
        { _id: { $in: uniqueUnitIds } },
        { $set: { status: "Available", orderId: null } },
      );
    }
  }

  // Revert quantity stock on cancellation
  if (newStatus === "Cancelled" && prevStatus !== "Delivered") {
    for (const item of order.items) {
      if (!item.inventoryUnitId) {
        // It was a quantity-based item — add stock back
        await PRODUCT_VARIANT.findByIdAndUpdate(item.productVariantId, {
          $inc: { stock: item.quantity },
        });
      }
    }
  }

  return order;
};

export default {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
