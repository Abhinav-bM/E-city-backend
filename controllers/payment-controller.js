import ORDER from "../models/order-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";
import {
  razorpay,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../services/razorpay-service.js";
import PaymentLog from "../models/payment-log-model.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// ── Shared helper: revert stock for a cancelled/failed order ──────────────────
const revertOrderStock = async (order) => {
  // Revert quantity-based stock
  for (const item of order.items) {
    if (!item.inventoryUnitId) {
      await PRODUCT_VARIANT.findByIdAndUpdate(item.productVariantId, {
        $inc: { stock: item.quantity },
      });
    }
  }

  // Revert unique-item reservations
  const uniqueUnitIds = order.items
    .filter((i) => i.inventoryUnitId)
    .map((i) => i.inventoryUnitId);

  if (uniqueUnitIds.length > 0) {
    await INVENTORY_UNIT.updateMany(
      { _id: { $in: uniqueUnitIds } },
      { $set: { status: "Available", orderId: null } },
    );
  }
};

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

  // Step 6: Guard against duplicate Razorpay order creation.
  // If a Razorpay order already exists for this DB order, return it instead
  // of creating a new one (which would orphan the first on Razorpay's side).
  if (order.razorpayOrderId) {
    return sendResponse(res, 200, true, "Payment order already exists.", {
      razorpayOrderId: order.razorpayOrderId,
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      keyId: process.env.RAZORPAY_ID_KEY,
    });
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return sendError(res, 400, "Missing payment verification data.");
  }

  // Fetch the order based on razorpayOrderId to prevent IDOR attacks
  const orderCheck = await ORDER.findOne({
    razorpayOrderId: razorpay_order_id,
  });
  if (!orderCheck)
    return sendError(res, 404, "Order not found or invalid payment order ID.");

  // Idempotency: if already paid, return success without re-processing
  if (orderCheck.paymentStatus === "Paid") {
    return sendResponse(
      res,
      200,
      true,
      "Payment already verified successfully.",
      orderCheck,
    );
  }

  // Step 1: Verify HMAC-SHA256 signature
  const isValid = verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    await PaymentLog.create({
      orderId: orderCheck._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event: "verify_attempt",
      status: "failure",
      message: "Signature mismatch",
      ip: req.ip,
    });
    return sendError(
      res,
      400,
      "Payment verification failed. Signature mismatch.",
    );
  }

  // Step 8: Server-to-server cross-verification with Razorpay API.
  // Confirms the payment was actually captured and the amount matches.
  // This is the second line of defense — cannot be bypassed by a client.
  const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

  if (rzpPayment.status !== "captured") {
    await PaymentLog.create({
      orderId: orderCheck._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event: "verify_attempt",
      status: "failure",
      message: `Payment not captured. Razorpay status: ${rzpPayment.status}`,
      ip: req.ip,
    });
    return sendError(res, 400, "Payment not yet captured by Razorpay.");
  }

  if (rzpPayment.amount !== Math.round(orderCheck.totalAmount * 100)) {
    await PaymentLog.create({
      orderId: orderCheck._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event: "verify_attempt",
      status: "failure",
      message: `Amount mismatch. Expected: ${Math.round(orderCheck.totalAmount * 100)}, Got: ${rzpPayment.amount}`,
      ip: req.ip,
    });
    return sendError(
      res,
      400,
      "Payment amount mismatch. Possible tampering detected.",
    );
  }

  // Step 3: Atomically mark the order as Paid using a conditional update.
  // The paymentStatus: "Pending" filter ensures this is a no-op if the
  // webhook already marked it Paid (race condition safe).
  const order = await ORDER.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id, paymentStatus: "Pending" },
    { $set: { paymentStatus: "Paid", razorpayPaymentId: razorpay_payment_id } },
    { new: true },
  );

  if (!order) {
    // Was already processed by webhook — idempotent response
    return sendResponse(
      res,
      200,
      true,
      "Payment already verified successfully.",
      orderCheck,
    );
  }

  // Log success for audit trail
  await PaymentLog.create({
    orderId: order._id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    event: "verify_attempt",
    status: "success",
    message: "Payment verified and marked as Paid",
    ip: req.ip,
  });

  // Step 4: Cart clear is a non-critical side effect.
  // Wrap in try/catch so a cart failure never rolls back a confirmed payment.
  try {
    const CART = (await import("../models/cart-model.js")).default;
    await CART.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [], totalItems: 0, subtotal: 0 } },
    );
  } catch (cartErr) {
    console.error(
      "[verifyPayment] Cart clear failed (non-critical):",
      cartErr.message,
    );
  }

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

  // Step 10: Guard — this endpoint only applies to Razorpay orders.
  // COD orders must never be deleted through this path.
  if (order.paymentMethod !== "Razorpay") {
    return sendError(
      res,
      400,
      "This endpoint only applies to Razorpay orders.",
    );
  }

  // Only revert if payment was still pending
  if (order.paymentStatus !== "Pending") {
    return sendError(res, 400, "Order payment is not in pending state.");
  }

  // Use shared revert helper to release inventory
  await revertOrderStock(order);

  // Delete the order so it doesn't clutter the user's order list on retry
  await order.deleteOne();

  return sendResponse(
    res,
    200,
    true,
    "Payment failed. Order removed so user can retry.",
  );
});

// ── Webhook to handle async Razorpay events ───────────────────────────────────
const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;

  if (!signature || !rawBody) {
    return res.status(400).send("Missing signature or raw body");
  }

  // Verify HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return res.status(400).send("Invalid webhook signature");
  }

  const payload = req.body;
  const event = payload.event;

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = payload.payload.payment.entity;
    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;
    const razorpay_amount = paymentEntity.amount;

    if (!razorpay_order_id) {
      return res.status(200).send("OK"); // Unknown event, ignored safely
    }

    // Verify amount matches before marking — prevents amount manipulation at the DB level
    const orderForCheck = await ORDER.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!orderForCheck) {
      return res.status(200).send("Order not found, ignored.");
    }

    if (razorpay_amount !== Math.round(orderForCheck.totalAmount * 100)) {
      console.error(
        `[Webhook] AMOUNT MISMATCH for Razorpay order ${razorpay_order_id}. ` +
          `Expected: ${Math.round(orderForCheck.totalAmount * 100)} paise, ` +
          `Got: ${razorpay_amount} paise. Investigate immediately.`,
      );
      await PaymentLog.create({
        orderId: orderForCheck._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        event,
        status: "failure",
        message: "Amount mismatch — possible tampering",
        meta: {
          expected: Math.round(orderForCheck.totalAmount * 100),
          received: razorpay_amount,
        },
      });
      // Return 200 so Razorpay doesn't retry — this must be investigated manually
      return res.status(200).send("Amount mismatch logged for investigation.");
    }

    // Step 3: Atomically mark as Paid.
    // The { paymentStatus: "Pending" } filter is the idempotency key.
    // If webhook fires twice, the second call will find no matching document
    // and skip all side effects — no double processing possible.
    const order = await ORDER.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, paymentStatus: "Pending" },
      {
        $set: { paymentStatus: "Paid", razorpayPaymentId: razorpay_payment_id },
      },
      { new: true },
    );

    if (!order) {
      // Already processed — idempotent, Razorpay retry handled safely
      return res.status(200).send("Already processed.");
    }

    // Audit log
    await PaymentLog.create({
      orderId: order._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event,
      status: "success",
      message: "Payment captured via webhook",
    });

    // Step 4: Cart clear wrapped so its failure never returns 500 to Razorpay.
    // If this fails, Razorpay would retry and double-process — that's why
    // the atomic update above is the idempotency guard, not the cart clear.
    try {
      const CART = (await import("../models/cart-model.js")).default;
      await CART.findOneAndUpdate(
        { userId: order.userId },
        { $set: { items: [], totalItems: 0, subtotal: 0 } },
      );
    } catch (cartErr) {
      console.error(
        "[Webhook] Cart clear failed (non-critical):",
        cartErr.message,
      );
    }
  } else if (event === "payment.failed") {
    // Step 5: Handle Razorpay's payment.failed event.
    // Previously unhandled — failed payments left stock permanently deducted.
    const paymentEntity = payload.payload.payment.entity;
    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;

    if (!razorpay_order_id) return res.status(200).send("OK");

    // Atomically mark as Failed — prevents race with cleanup job
    const order = await ORDER.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, paymentStatus: "Pending" },
      { $set: { paymentStatus: "Failed", orderStatus: "Cancelled" } },
      { new: true },
    );

    if (order) {
      await revertOrderStock(order);
      await PaymentLog.create({
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        event,
        status: "failure",
        message: "Payment failed — stock reverted via webhook",
      });
    }
  }

  // NOTE: All DB errors propagate through asyncHandler → errorMiddleware → 500
  // so Razorpay will retry on genuine DB failures. DO NOT add a catch block here.
  return res.status(200).send("OK");
});

export {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  paymentWebhook,
};
