import mongoose from "mongoose";
import ORDER from "../models/order-model.js";
import CART from "../models/cart-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";

// ── Shared helper: atomically reduce stock for a confirmed/COD order ───────────
// Called during COD order creation (within transaction) and payment verification.
// Returns an array of {productVariantId, quantity, inventoryUnitId} for rollback.
export const deductOrderStock = async (orderItems, session) => {
  for (const item of orderItems) {
    if (!item.inventoryUnitId) {
      // Quantity-based: atomically decrement
      const updated = await PRODUCT_VARIANT.findOneAndUpdate(
        { _id: item.productVariantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );
      if (!updated) {
        throw new Error(
          `A product became out of stock. Please refresh and try again.`,
        );
      }
    } else {
      // Unique-item: mark as Reserved (idempotent — already "Reserved" in pending order)
      const updated = await INVENTORY_UNIT.findOneAndUpdate(
        { _id: item.inventoryUnitId, status: "Reserved" },
        { $set: { status: "Reserved" } }, // no-op if already Reserved
        { new: true, session },
      );
      if (!updated) {
        throw new Error(
          `A unique item is no longer available. Checkout cannot proceed.`,
        );
      }
    }
  }
};

/**
 * createOrder — places an order from the user's active cart.
 *
 * Razorpay flow: Validates stock availability only (no reservation/deduction).
 *                Stock is atomically deducted inside verifyPayment (payment-controller).
 *
 * COD flow: Full atomic stock deduction runs here inside a MongoDB transaction.
 *           If any item fails, the whole transaction rolls back cleanly.
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

  // 2. Build order items + validate stock (read-only — no deduction yet for Razorpay)
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const variant = cartItem.productVariantId;
    if (!variant)
      throw new Error("A product in your cart is no longer available.");

    const priceAtOrder = cartItem.priceAtAdd;
    const quantity = cartItem.quantity;

    // ── Quantity-based: validate availability, but DO NOT decrement yet ──────
    if (variant.inventoryType !== "Unique") {
      const freshVariant = await PRODUCT_VARIANT.findById(variant._id).lean();
      if (!freshVariant || freshVariant.stock < quantity) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" only has ${freshVariant?.stock ?? 0} units left.`,
        );
      }
    }

    // ── Unique-item: validate an Available unit exists, but DO NOT reserve ───
    let inventoryUnitId = null;
    if (variant.inventoryType === "Unique") {
      const availableUnit = await INVENTORY_UNIT.findOne({
        productVariantId: variant._id,
        status: "Available",
        isArchived: false,
      }).lean();
      if (!availableUnit) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" is no longer available.`,
        );
      }
      // For Razorpay: we mark "Reserved" at payment time.
      // For COD: we'll reserve inside the transaction below.
      // Store the ID of the available unit for COD to use.
      inventoryUnitId = paymentMethod === "COD" ? availableUnit._id : null;
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

  const shippingFee = 0;
  const totalAmount = subtotal + shippingFee;

  // ── COD path: full transactional stock deduction ──────────────────────────
  if (paymentMethod === "COD") {
    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        // For Unique items being reserved via COD, do atomic reservation
        for (const item of orderItems) {
          if (item.inventoryUnitId) {
            const reserved = await INVENTORY_UNIT.findOneAndUpdate(
              {
                _id: item.inventoryUnitId,
                status: "Available",
                isArchived: false,
              },
              { $set: { status: "Reserved", orderId: "pending" } },
              { new: true, session },
            );
            if (!reserved) {
              throw new Error(
                `A unique item was just taken. Please try again.`,
              );
            }
          } else {
            // Quantity-based: atomically decrement
            const updated = await PRODUCT_VARIANT.findOneAndUpdate(
              { _id: item.productVariantId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true, session },
            );
            if (!updated) {
              throw new Error(
                `A product ran out of stock. Please refresh and try again.`,
              );
            }
          }
        }

        order = await ORDER.create(
          [
            {
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
              stockDeducted: true, // flag: stock was already deducted
            },
          ],
          { session },
        );
        order = order[0];

        // Link inventory units to the real order ID
        const uniqueUnitIds = orderItems
          .filter((i) => i.inventoryUnitId)
          .map((i) => i.inventoryUnitId);

        if (uniqueUnitIds.length > 0) {
          await INVENTORY_UNIT.updateMany(
            { _id: { $in: uniqueUnitIds } },
            { $set: { orderId: order._id.toString() } },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }

    // Clear cart for COD after successful transaction
    await CART.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalItems: 0, subtotal: 0 } },
    );

    return order;
  }

  // ── Razorpay path: create order record only — stock deducted at payment ───
  // inventoryUnitId is null for all Razorpay items (reserved at payment time).
  const razorpayOrderItems = orderItems.map((i) => ({
    ...i,
    inventoryUnitId: null,
  }));

  const order = await ORDER.create({
    userId,
    items: razorpayOrderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: "Pending",
    orderStatus: "Placed",
    subtotal,
    shippingFee,
    totalAmount,
    notes: notes || "",
    stockDeducted: false, // flag: stock NOT yet deducted
  });

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
 * Stock revert on cancellation is wrapped in a transaction to prevent
 * partial state (order Cancelled but stock not restored).
 */
const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  const order = await ORDER.findById(orderId);
  if (!order) throw new Error("Order not found.");

  const prevStatus = order.orderStatus;

  // ── Non-cancellation path: simple save, no stock side effects ────────────
  if (newStatus !== "Cancelled") {
    order.orderStatus = newStatus;

    if (newStatus === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }

    if (newStatus === "Shipped") {
      if (extraData.trackingId) {
        order.trackingId = extraData.trackingId;
      }
      
      // Strict IMEI Verification for Backend
      const requiredImeiCount = order.items.filter((i) => i.inventoryUnitId).length;
      
      if (requiredImeiCount > 0) {
         if (!extraData.shippedImeis || !Array.isArray(extraData.shippedImeis) || extraData.shippedImeis.length !== requiredImeiCount) {
             throw new Error(`Strict Validation Failed: Exactly ${requiredImeiCount} IMEI/Serial numbers are required to ship this order.`);
         }
      }

      if (extraData.shippedImeis && Array.isArray(extraData.shippedImeis)) {
        order.shippedImeis = extraData.shippedImeis;
      }
    }

    await order.save();

    // On delivery, mark unique units as Sold
    if (newStatus === "Delivered") {
      const uniqueUnitIds = order.items
        .filter((i) => i.inventoryUnitId)
        .map((i) => i.inventoryUnitId);

      if (uniqueUnitIds.length > 0) {
        await INVENTORY_UNIT.updateMany(
          { _id: { $in: uniqueUnitIds } },
          { $set: { status: "Sold", soldDate: new Date() } },
        );
      }
    }

    return order;
  }

  // ── Cancellation path: transactional status update + stock revert ─────────
  if (prevStatus === "Delivered") {
    // Cannot cancel a delivered order — just update status without stock change
    order.orderStatus = newStatus;
    await order.save();
    return order;
  }

  const session = await mongoose.startSession();
  let updatedOrder;

  try {
    await session.withTransaction(async () => {
      // 1. Mark order as Cancelled
      updatedOrder = await ORDER.findByIdAndUpdate(
        orderId,
        { $set: { orderStatus: "Cancelled" } },
        { new: true, session },
      );

      // 2. Revert unique inventory units to Available
      const uniqueUnitIds = updatedOrder.items
        .filter((i) => i.inventoryUnitId)
        .map((i) => i.inventoryUnitId);

      if (uniqueUnitIds.length > 0) {
        await INVENTORY_UNIT.updateMany(
          { _id: { $in: uniqueUnitIds } },
          { $set: { status: "Available", orderId: null } },
          { session },
        );
      }

      // 3. Revert quantity stock — only if stock was actually deducted
      if (updatedOrder.stockDeducted) {
        for (const item of updatedOrder.items) {
          if (!item.inventoryUnitId) {
            await PRODUCT_VARIANT.findByIdAndUpdate(
              item.productVariantId,
              { $inc: { stock: item.quantity } },
              { session },
            );
          }
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return updatedOrder;
};

/**
 * createDirectOrder — places an order for a single item (Buy Now).
 *
 * Same two-phase approach as createOrder:
 * - Razorpay: validate only, deduct at payment time.
 * - COD: validate + deduct atomically inside a transaction.
 */
const createDirectOrder = async ({
  userId,
  shippingAddress,
  paymentMethod = "COD",
  notes,
  directItems,
}) => {
  if (!directItems || !Array.isArray(directItems) || directItems.length === 0) {
    throw new Error("No items provided for direct checkout.");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of directItems) {
    // ── Security: validate quantity from frontend ──────────────────────────
    const quantity = parseInt(item.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error(
        "Invalid quantity. Must be a whole number between 1 and 100.",
      );
    }

    const variant = await PRODUCT_VARIANT.findById(
      item.productVariantId,
    ).populate("baseProductId", "title");
    if (!variant) throw new Error("A product selected is no longer available.");

    // Backend price — NEVER trust frontend price
    const priceAtOrder = variant.sellingPrice;

    // ── Quantity-based: validate only ─────────────────────────────────────
    if (variant.inventoryType !== "Unique") {
      if (variant.stock < quantity) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" only has ${variant.stock ?? 0} units left.`,
        );
      }
    }

    // ── Unique-item: validate an Available unit exists ───────────────────
    let inventoryUnitId = null;
    if (variant.inventoryType === "Unique") {
      const availableUnit = await INVENTORY_UNIT.findOne({
        productVariantId: variant._id,
        status: "Available",
        isArchived: false,
      }).lean();
      if (!availableUnit) {
        throw new Error(
          `"${variant.baseProductId?.title || "A product"}" is no longer available.`,
        );
      }
      inventoryUnitId = paymentMethod === "COD" ? availableUnit._id : null;
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

  const shippingFee = 0;
  const totalAmount = subtotal + shippingFee;

  // ── COD path: full transactional stock deduction ──────────────────────────
  if (paymentMethod === "COD") {
    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        for (const item of orderItems) {
          if (item.inventoryUnitId) {
            const reserved = await INVENTORY_UNIT.findOneAndUpdate(
              {
                _id: item.inventoryUnitId,
                status: "Available",
                isArchived: false,
              },
              { $set: { status: "Reserved", orderId: "pending" } },
              { new: true, session },
            );
            if (!reserved) {
              throw new Error(
                `A unique item was just taken. Please try again.`,
              );
            }
          } else {
            const updated = await PRODUCT_VARIANT.findOneAndUpdate(
              { _id: item.productVariantId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true, session },
            );
            if (!updated) {
              throw new Error(
                `A product ran out of stock. Please refresh and try again.`,
              );
            }
          }
        }

        order = await ORDER.create(
          [
            {
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
              stockDeducted: true,
            },
          ],
          { session },
        );
        order = order[0];

        const uniqueUnitIds = orderItems
          .filter((i) => i.inventoryUnitId)
          .map((i) => i.inventoryUnitId);

        if (uniqueUnitIds.length > 0) {
          await INVENTORY_UNIT.updateMany(
            { _id: { $in: uniqueUnitIds } },
            { $set: { orderId: order._id.toString() } },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return order;
  }

  // ── Razorpay path: create order record only ───────────────────────────────
  const razorpayOrderItems = orderItems.map((i) => ({
    ...i,
    inventoryUnitId: null,
  }));

  const order = await ORDER.create({
    userId,
    items: razorpayOrderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: "Pending",
    orderStatus: "Placed",
    subtotal,
    shippingFee,
    totalAmount,
    notes: notes || "",
    stockDeducted: false,
  });

  return order;
};

export default {
  createOrder,
  createDirectOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
