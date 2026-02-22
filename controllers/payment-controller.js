import ORDER from "../models/order-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../services/razorpay-service.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// ── Create a Razorpay order for a pending order ───────────────────────────────
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return sendError(res, 400, "orderId is required.");

  const order = await ORDER.findById(orderId);
  if (!order) return sendError(res, 404, "Order not found.");
  if (order.userId.toString() !== req.user.userId) {
    return sendError(res, 403, "Access denied.");
  }
  if (order.paymentStatus === "Paid") {
    return sendError(res, 400, "Order is already paid.");
  }

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder(
    order.totalAmount,
    order._id.toString(),
  );

  // Save razorpay order ID on our order
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return sendResponse(res, 200, true, "Payment order created.", {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_ID_KEY,
  });
});

// ── Verify Razorpay payment signature + mark paid ─────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !orderId
  ) {
    return sendError(res, 400, "Missing payment verification data.");
  }

  // 1. Verify signature
  const isValid = verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    // Mark payment as failed
    await ORDER.findByIdAndUpdate(orderId, { paymentStatus: "Failed" });
    return sendError(
      res,
      400,
      "Payment verification failed. Signature mismatch.",
    );
  }

  // 2. Mark order as paid
  const order = await ORDER.findById(orderId);
  if (!order) return sendError(res, 404, "Order not found.");

  order.paymentStatus = "Paid";
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  // Clear the cart now that payment is successful
  const CART = (await import("../models/cart-model.js")).default;
  await CART.findOneAndUpdate(
    { userId: order.userId },
    { $set: { items: [], totalItems: 0, subtotal: 0 } },
  );

  return sendResponse(res, 200, true, "Payment verified successfully.", order);
});

// ── Handle payment failure (called from frontend when user cancels/fails) ─────
const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return sendError(res, 400, "orderId is required.");

  const order = await ORDER.findById(orderId);
  if (!order) return sendError(res, 404, "Order not found.");
  if (order.userId.toString() !== req.user.userId) {
    return sendError(res, 403, "Access denied.");
  }

  // Only revert if payment was still pending
  if (order.paymentStatus !== "Pending") {
    return sendError(res, 400, "Order payment is not in pending state.");
  }

  // We don't want pending/failed orders cluttering the database for every retry.
  // Revert inventory first, then completely delete the order record.

  // Revert inventory — quantity-based
  for (const item of order.items) {
    if (!item.inventoryUnitId) {
      await PRODUCT_VARIANT.findByIdAndUpdate(item.productVariantId, {
        $inc: { stock: item.quantity },
      });
    }
  }

  // Revert inventory — unique items
  const uniqueUnitIds = order.items
    .filter((i) => i.inventoryUnitId)
    .map((i) => i.inventoryUnitId);

  if (uniqueUnitIds.length > 0) {
    await INVENTORY_UNIT.updateMany(
      { _id: { $in: uniqueUnitIds } },
      { $set: { status: "Available", orderId: null } },
    );
  }

  // Now delete the order entirely so it doesn't show up in the frontend list
  await order.deleteOne();

  return sendResponse(
    res,
    200,
    true,
    "Payment failed. Order removed so user can retry.",
  );
});

export { createPaymentOrder, verifyPayment, handlePaymentFailure };
