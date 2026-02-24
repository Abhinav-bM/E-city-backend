import logger from "../utils/logger.js";
import mongoose from "mongoose";
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

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * deductStockInTransaction
 * Atomically reduces stock for every item in an order.
 * Must be called inside an active Mongoose session/transaction.
 * Throws if ANY item cannot be decremented (out of stock).
 *
 * Quantity items : { stock: { $gte: quantity } } guard prevents overselling.
 * Unique items   : { status: "Available" } guard prevents double-sale.
 */
const deductStockInTransaction = async (orderItems, session) => {
  for (const item of orderItems) {
    if (!item.inventoryUnitId) {
      const updated = await PRODUCT_VARIANT.findOneAndUpdate(
        { _id: item.productVariantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );
      if (!updated) {
        throw new Error(`STOCK_UNAVAILABLE:${item.productVariantId}`);
      }
    } else {
      // Unique item: claim the specific unit atomically
      const updated = await INVENTORY_UNIT.findOneAndUpdate(
        { _id: item.inventoryUnitId, status: "Available", isArchived: false },
        { $set: { status: "Reserved", orderId: "pending" } },
        { new: true, session },
      );
      if (!updated) {
        throw new Error(`STOCK_UNAVAILABLE:${item.productVariantId}`);
      }
    }
  }
};

/**
 * revertOrderStock
 * Restores stock for a confirmed order that is being cancelled.
 * Guards on `order.stockDeducted` — safe no-op for pending Razorpay orders
 * where stock was never actually reduced.
 */
const revertOrderStock = async (order) => {
  if (!order.stockDeducted) return;

  for (const item of order.items) {
    if (!item.inventoryUnitId) {
      await PRODUCT_VARIANT.findByIdAndUpdate(item.productVariantId, {
        $inc: { stock: item.quantity },
      });
    }
  }

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

/**
 * issueRazorpayRefund
 * Triggers a full refund for a captured Razorpay payment.
 * Returns the refund object or null on failure (logged, never throws).
 */
const issueRazorpayRefund = async ({
  razorpay_payment_id,
  amountPaise,
  orderId,
  reason,
}) => {
  try {
    const refund = await razorpay.payments.refund(razorpay_payment_id, {
      amount: amountPaise,
      notes: { reason, orderId: orderId.toString() },
    });
    logger.info("Refund issued", {
      refundId: refund.id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise,
      reason,
    });
    return refund;
  } catch (err) {
    logger.error("Refund failed", {
      razorpayPaymentId: razorpay_payment_id,
      error: err.message,
    });
    return null;
  }
};

/**
 * processVerifiedPayment
 * The central, fully-transactional payment commitment function.
 * Called by both verifyPayment (client-side) and paymentWebhook (server-side).
 *
 * Everything happens inside ONE MongoDB transaction:
 *   1. Atomically claim order (paymentStatus: "Pending" → "Paid")
 *   2. Atomically deduct stock for every item
 *   3. Link InventoryUnit orderId to the real order ID
 *   4. Set stockDeducted: true
 *
 * If stock fails (item sold out between cart and payment):
 *   - Transaction aborts (order never marked Paid, stock never touched)
 *   - Order is marked Failed/Cancelled in a follow-up write
 *   - Automatic Razorpay refund is triggered
 *
 * Returns: { order, stockFailure, refundId }
 *   order        → the committed order document, or null if already processed
 *   stockFailure → true if stock was unavailable at payment time
 *   refundId     → Razorpay refund ID if a refund was issued, else null
 */
const processVerifiedPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
}) => {
  const session = await mongoose.startSession();
  let resultOrder = null;
  let stockFailure = false;
  let failedOrderId = null;
  let failedOrderAmount = null;

  try {
    await session.withTransaction(async () => {
      // ── Step 1: Atomically claim the order ──────────────────────────────
      // { paymentStatus: "Pending" } is the idempotency key.
      // If the webhook already processed this, findOneAndUpdate returns null → no-op.
      const order = await ORDER.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "Pending" },
        {
          $set: {
            paymentStatus: "Paid",
            razorpayPaymentId: razorpay_payment_id,
            stockDeducted: true,
          },
        },
        { new: true, session },
      );

      if (!order) return; // Already processed — idempotent exit

      // ── Step 2: Deduct stock (still inside same transaction) ─────────────
      try {
        await deductStockInTransaction(order.items, session);
      } catch (stockErr) {
        // Stock unavailable — abort this entire transaction.
        // order will NOT be committed as Paid. We record info for cleanup.
        stockFailure = true;
        failedOrderId = order._id;
        failedOrderAmount = Math.round(order.totalAmount * 100);
        throw stockErr; // Triggers transaction rollback
      }

      // ── Step 3: Link InventoryUnit orderId (inside same transaction) ─────
      // This ensures the orderId update is atomic with the stock deduction.
      // If this fails, everything rolls back together.
      const uniqueUnitIds = order.items
        .filter((i) => i.inventoryUnitId)
        .map((i) => i.inventoryUnitId);

      if (uniqueUnitIds.length > 0) {
        await INVENTORY_UNIT.updateMany(
          { _id: { $in: uniqueUnitIds } },
          { $set: { orderId: order._id.toString() } },
          { session },
        );
      }

      resultOrder = order;
    });
  } catch (err) {
    // If stockFailure, the transaction rolled back — order is still "Pending".
    // We do NOT re-throw; caller handles stockFailure path below.
    if (!stockFailure) throw err; // Genuine DB error — re-throw for asyncHandler
  } finally {
    await session.endSession();
  }

  // ── Step 4: Post-transaction cleanup for stock failure ──────────────────────
  // Transaction rolled back, so we now mark the order as Failed/Cancelled
  // in a separate write (outside the aborted transaction).
  let refundId = null;
  if (stockFailure && failedOrderId) {
    await ORDER.findByIdAndUpdate(failedOrderId, {
      $set: {
        paymentStatus: "Failed",
        orderStatus: "Cancelled",
        stockDeducted: false,
      },
    });

    // Automatically refund the captured payment — customer should never have to chase this.
    const refund = await issueRazorpayRefund({
      razorpay_payment_id,
      amountPaise: failedOrderAmount,
      orderId: failedOrderId,
      reason: "Item went out of stock after payment was captured.",
    });
    refundId = refund?.id ?? null;
  }

  return { order: resultOrder, stockFailure, refundId };
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createPaymentOrder
 * Creates a Razorpay order for an existing pending DB order.
 * Idempotent: if razorpayOrderId already exists, returns it without creating a new one.
 */
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

  if (order.razorpayOrderId) {
    return sendResponse(res, 200, true, "Payment order already exists.", {
      razorpayOrderId: order.razorpayOrderId,
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      keyId: process.env.RAZORPAY_ID_KEY,
    });
  }

  const razorpayOrder = await createRazorpayOrder(
    order.totalAmount,
    order._id.toString(),
  );

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return sendResponse(res, 200, true, "Payment order created.", {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_ID_KEY,
  });
});

/**
 * verifyPayment
 * Client-side payment verification endpoint.
 * Flow: HMAC verify → Razorpay API cross-check → atomic stock + Paid commit.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return sendError(res, 400, "Missing payment verification data.");
  }

  // Fetch order by razorpayOrderId to prevent IDOR attacks
  const orderCheck = await ORDER.findOne({
    razorpayOrderId: razorpay_order_id,
  });
  if (!orderCheck)
    return sendError(res, 404, "Order not found or invalid payment order ID.");

  // Idempotency: already paid — return success
  if (orderCheck.paymentStatus === "Paid") {
    return sendResponse(
      res,
      200,
      true,
      "Payment already verified successfully.",
      orderCheck,
    );
  }

  // ── Step 1: HMAC-SHA256 signature verification ────────────────────────────
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

  // ── Step 2: Server-side cross-check with Razorpay API ────────────────────
  const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

  if (rzpPayment.status !== "captured") {
    await PaymentLog.create({
      orderId: orderCheck._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event: "verify_attempt",
      status: "failure",
      message: `Payment not captured. Status: ${rzpPayment.status}`,
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

  // ── Step 3: Atomic stock deduction + order commit ─────────────────────────
  const { order, stockFailure, refundId } = await processVerifiedPayment({
    razorpay_order_id,
    razorpay_payment_id,
  });

  if (stockFailure) {
    await PaymentLog.create({
      orderId: orderCheck._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      event: "verify_attempt",
      status: "failure",
      message: `Stock unavailable at payment time. Order cancelled. Refund: ${refundId ?? "FAILED — manual action required"}`,
      ip: req.ip,
    });

    const clientMsg = refundId
      ? "This item just went out of stock. An automatic refund has been initiated and will reflect in 5–7 business days."
      : "This item just went out of stock. Your payment will be manually refunded. Please contact support.";

    return sendError(res, 409, clientMsg);
  }

  if (!order) {
    // Already processed by webhook — idempotent
    return sendResponse(
      res,
      200,
      true,
      "Payment already verified successfully.",
      orderCheck,
    );
  }

  await PaymentLog.create({
    orderId: order._id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    event: "verify_attempt",
    status: "success",
    message: "Payment verified, stock deducted, order marked Paid",
    ip: req.ip,
  });

  // Cart clear — non-critical side effect, never breaks payment confirmation
  try {
    const CART = (await import("../models/cart-model.js")).default;
    await CART.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [], totalItems: 0, subtotal: 0 } },
    );
  } catch (cartErr) {
    logger.warn("Cart clear failed after payment verification (non-critical)", {
      userId: order?.userId,
      error: cartErr.message,
    });
  }

  return sendResponse(res, 200, true, "Payment verified successfully.", order);
});

/**
 * handlePaymentFailure
 * Called from frontend when user cancels or payment fails on Razorpay modal.
 * For pending Razorpay orders: stock was never deducted (revertOrderStock is a no-op).
 */
const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return sendError(res, 400, "orderId is required.");

  const order = await ORDER.findById(orderId);
  if (!order) return sendError(res, 404, "Order not found.");
  if (order.userId.toString() !== req.user.userId) {
    return sendError(res, 403, "Access denied.");
  }
  if (order.paymentMethod !== "Razorpay") {
    return sendError(
      res,
      400,
      "This endpoint only applies to Razorpay orders.",
    );
  }
  if (order.paymentStatus !== "Pending") {
    return sendError(res, 400, "Order payment is not in pending state.");
  }

  // stockDeducted is false for pending Razorpay orders — revertOrderStock is a safe no-op
  await revertOrderStock(order);
  await order.deleteOne();

  return sendResponse(
    res,
    200,
    true,
    "Payment failed. Order removed so user can retry.",
  );
});

/**
 * paymentWebhook
 * Handles async events from Razorpay (payment.captured, order.paid, payment.failed).
 * Uses the same processVerifiedPayment transaction as verifyPayment for consistency.
 */
const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;

  if (!signature || !rawBody) {
    return res.status(400).send("Missing signature or raw body");
  }

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

    if (!razorpay_order_id) return res.status(200).send("OK");

    const orderForCheck = await ORDER.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!orderForCheck)
      return res.status(200).send("Order not found, ignored.");

    // Amount sanity check before committing
    if (razorpay_amount !== Math.round(orderForCheck.totalAmount * 100)) {
      logger.error("Payment amount mismatch detected", {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        expectedPaise: Math.round(orderForCheck.totalAmount * 100),
        receivedPaise: razorpay_amount,
      });
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
      return res.status(200).send("Amount mismatch logged for investigation.");
    }

    // Atomic stock deduction + Paid commit (same function used by verifyPayment)
    const { order, stockFailure, refundId } = await processVerifiedPayment({
      razorpay_order_id,
      razorpay_payment_id,
    });

    if (stockFailure) {
      await PaymentLog.create({
        orderId: orderForCheck._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        event,
        status: "failure",
        message: `Stock unavailable via webhook. Order cancelled. Refund: ${refundId ?? "FAILED — manual action required"}`,
      });
      return res
        .status(200)
        .send("Stock unavailable — order cancelled, refund initiated.");
    }

    if (order) {
      await PaymentLog.create({
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        event,
        status: "success",
        message:
          "Payment captured via webhook — stock deducted, order marked Paid",
      });

      try {
        const CART = (await import("../models/cart-model.js")).default;
        await CART.findOneAndUpdate(
          { userId: order.userId },
          { $set: { items: [], totalItems: 0, subtotal: 0 } },
        );
      } catch (cartErr) {
        logger.warn("Cart clear failed after webhook capture (non-critical)", {
          userId: order?.userId,
          error: cartErr.message,
        });
      }
    }
    // null order → already processed by verifyPayment (idempotent)
  } else if (event === "payment.failed") {
    const paymentEntity = payload.payload.payment.entity;
    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;

    if (!razorpay_order_id) return res.status(200).send("OK");

    const order = await ORDER.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, paymentStatus: "Pending" },
      { $set: { paymentStatus: "Failed", orderStatus: "Cancelled" } },
      { new: true },
    );

    if (order) {
      // stockDeducted is false for pending Razorpay orders — no-op
      await revertOrderStock(order);
      await PaymentLog.create({
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        event,
        status: "failure",
        message:
          "Payment failed via webhook — order cancelled (stock was not deducted)",
      });
    }
  }

  return res.status(200).send("OK");
});

export {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  paymentWebhook,
};
