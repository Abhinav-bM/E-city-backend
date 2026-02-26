import orderService from "../services/order-service.js";
import { createRazorpayOrder } from "../services/razorpay-service.js";
import generateInvoicePDF from "../services/invoice-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// ── Customer: place an order from active cart ─────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { shippingAddress, paymentMethod, notes, existingOrderId } = req.body;

  if (!shippingAddress && !existingOrderId) {
    return sendError(res, 400, "Shipping address is required.");
  }

  let order;

  if (existingOrderId) {
    order = await (
      await import("../models/order-model.js")
    ).default.findById(existingOrderId);
    // If order exists, belongs to user, and is still pending, we reuse it.
    // Otherwise, it might have been marked Failed/Cancelled, so we create a new one.
    if (
      !order ||
      order.userId.toString() !== userId ||
      order.paymentStatus !== "Pending"
    ) {
      order = null;
    }
  }

  if (!order) {
    order = await orderService.createOrder({
      userId,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      notes,
    });
  }

  // If Razorpay — create a Razorpay order and return the details
  if (paymentMethod === "Razorpay") {
    // Step 6: Guard — if this is a reused existing order already having a
    // razorpayOrderId, return it as-is. Creating a new one would orphan the
    // first on Razorpay's side (the client would have no way to pay it).
    if (!order.razorpayOrderId) {
      const razorpayOrder = await createRazorpayOrder(
        order.totalAmount,
        order._id.toString(),
      );
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    return sendResponse(res, 201, true, "Order created. Complete payment.", {
      ...order.toObject(),
      razorpayOrder: {
        id: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        keyId: process.env.RAZORPAY_ID_KEY,
      },
    });
  }

  return sendResponse(res, 201, true, "Order placed successfully.", order);
});

// ── Customer: list own orders ─────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const orders = await orderService.getOrdersByUser(userId);
  return sendResponse(res, 200, true, "Orders fetched successfully.", orders);
});

// ── Admin: list all orders (paginated, optional status filter) ────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.getAllOrders({
    status,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  return sendResponse(res, 200, true, "Orders fetched successfully.", result);
});

// ── Admin + Customer: single order detail ─────────────────────────────────────
const getOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);

  // Customers may only view their own orders
  if (
    req.user.role !== "admin" &&
    order.userId?._id?.toString() !== req.user.userId
  ) {
    return sendError(res, 403, "Access denied.");
  }

  return sendResponse(res, 200, true, "Order fetched successfully.", order);
});

// ── Admin: update order status ────────────────────────────────────────────────
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, trackingId, shippedImeis } = req.body;

  const validStatuses = [
    "Placed",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  if (!status || !validStatuses.includes(status)) {
    return sendError(
      res,
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
  }

  if (status === "Shipped" && !trackingId) {
    return sendError(
      res,
      400,
      "Tracking ID is required when marking an order as Shipped.",
    );
  }

  const order = await orderService.updateOrderStatus(id, status, {
    trackingId,
    shippedImeis,
  });
  return sendResponse(res, 200, true, "Order status updated.", order);
});

// ── Download Invoice PDF ──────────────────────────────────────────────────────
const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);

  // Ownership check for customers
  if (
    req.user.role !== "admin" &&
    order.userId?._id?.toString() !== req.user.userId
  ) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  const invoiceNo = `INV-${id.slice(-8).toUpperCase()}`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${invoiceNo}.pdf`);

  generateInvoicePDF(order, res);
});

// ── Customer: place direct order (buy now) ──────────────────────────────────
const placeDirectOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    shippingAddress,
    paymentMethod,
    notes,
    existingOrderId,
    directItems,
  } = req.body;

  if (!shippingAddress && !existingOrderId) {
    return sendError(res, 400, "Shipping address is required.");
  }

  let order;

  if (existingOrderId) {
    order = await (
      await import("../models/order-model.js")
    ).default.findById(existingOrderId);
    // If order exists, belongs to user, and is still pending, we reuse it.
    // Otherwise, it might have been marked Failed/Cancelled, so we create a new one.
    if (
      !order ||
      order.userId.toString() !== userId ||
      order.paymentStatus !== "Pending"
    ) {
      order = null;
    }
  }

  if (!order) {
    order = await orderService.createDirectOrder({
      userId,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      notes,
      directItems,
    });
  }

  // If Razorpay — create a Razorpay order and return the details
  if (paymentMethod === "Razorpay") {
    // Step 6: Guard — reuse existing razorpayOrderId if already set
    if (!order.razorpayOrderId) {
      const razorpayOrder = await createRazorpayOrder(
        order.totalAmount,
        order._id.toString(),
      );
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    return sendResponse(res, 201, true, "Order created. Complete payment.", {
      ...order.toObject(),
      razorpayOrder: {
        id: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        keyId: process.env.RAZORPAY_ID_KEY,
      },
    });
  }

  return sendResponse(
    res,
    201,
    true,
    "Direct order placed successfully.",
    order,
  );
});

export {
  placeOrder,
  placeDirectOrder,
  getMyOrders,
  getAllOrders,
  getOrderDetail,
  updateStatus,
  downloadInvoice,
};
