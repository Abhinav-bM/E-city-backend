import cron from "node-cron";
import ORDER from "../models/order-model.js";
import { razorpay } from "../services/razorpay-service.js";
import { processVerifiedPayment } from "../controllers/payment-controller.js";
import logger from "../utils/logger.js";

/**
 * reconcilePendingPayments
 * Searches for "Pending" orders created more than 15 minutes ago that have a
 * razorpayOrderId, and synchronizes their status with the Razorpay API.
 * This acts as a safety-net for missed webhooks or dropped client connections.
 */
export const reconcilePendingPayments = async () => {
  logger.info("Starting Payment Reconciliation Worker...");

  try {
    // 1. Find orders stuck in "Pending" for > 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const pendingOrders = await ORDER.find({
      paymentStatus: "Pending",
      paymentMethod: "Razorpay",
      razorpayOrderId: { $exists: true, $ne: null },
      createdAt: { $lt: fifteenMinutesAgo },
    });

    if (pendingOrders.length === 0) {
      logger.info("No pending orders found for reconciliation.");
      return;
    }

    logger.info(`Found ${pendingOrders.length} orders to reconcile.`);

    for (const order of pendingOrders) {
      try {
        // 2. Fetch the REAL status from Razorpay's server
        // We use fetchPayments to find any successful payment associated with this order ID
        const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        
        // Look for a captured payment
        const successfulPayment = payments.items.find(
          (p) => p.status === "captured" || p.status === "authorized"
        );

        if (successfulPayment) {
          logger.info(`Order ${order._id} was PAID on Razorpay. Synchronizing...`);
          
          // 3. Trigger our standard atomic payment commitment logic
          const { stockFailure, refundId } = await processVerifiedPayment({
            razorpay_order_id: order.razorpayOrderId,
            razorpay_payment_id: successfulPayment.id,
          });

          if (stockFailure) {
            logger.warn(`Order ${order._id} was paid but items are out of stock. Refunded: ${refundId}`);
          } else {
            logger.info(`Order ${order._id} successfully synchronized to PAID.`);
          }
        } else {
          // If the order is very old (> 24 hours) and still has no payment, we mark it as failed
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          if (order.createdAt < twentyFourHoursAgo) {
            logger.info(`Order ${order._id} is > 24h old with no payment. Marking as Failed.`);
            await ORDER.findByIdAndUpdate(order._id, {
              $set: { paymentStatus: "Failed", orderStatus: "Cancelled" }
            });
          }
        }
      } catch (orderErr) {
        logger.error(`Failed to reconcile order ${order._id}:`, orderErr.message);
      }
    }
  } catch (err) {
    logger.error("Payment Reconciliation Worker Error:", err.message);
  }

  logger.info("Payment Reconciliation Worker Finished.");
};

/**
 * startPaymentReconciliationWorker
 * Schedules the worker to run every 30 minutes.
 * Also triggers one immediate run on startup to catch any downtime gaps.
 */
export const startPaymentReconciliationWorker = () => {
  // 1. Run immediately on startup
  reconcilePendingPayments();

  // 2. Schedule every 30 minutes
  // Cron expression: 0,30 * * * * (runs at minute 0 and 30 of every hour)
  cron.schedule("*/30 * * * *", () => {
    reconcilePendingPayments();
  });

  logger.info("Payment Reconciliation Worker Scheduled (Every 30m).");
};
