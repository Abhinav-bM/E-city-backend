import ORDER from "../models/order-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";
import logger from "../utils/logger.js";

/**
 * Periodically scan for Razorpay orders that were created but never paid (abandoned).
 * Cancels them and atomically returns the locked stock back to the inventory pool.
 */
export const cleanupAbandonedOrders = async () => {
  try {
    // 30 minutes expiry window
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedOrders = await ORDER.find({
      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
      orderStatus: "Placed",
      createdAt: { $lt: thirtyMinutesAgo },
    });

    for (const order of abandonedOrders) {
      // 1. Update order status
      order.orderStatus = "Cancelled";
      order.paymentStatus = "Failed";
      await order.save();

      // 2. Revert Quantity-based stock using atomic $inc
      for (const item of order.items) {
        if (!item.inventoryUnitId) {
          await PRODUCT_VARIANT.updateOne(
            { _id: item.productVariantId },
            { $inc: { stock: item.quantity } },
          );
        }
      }

      // 3. Revert Unique-item reservations
      const uniqueUnitIds = order.items
        .filter((i) => i.inventoryUnitId)
        .map((i) => i.inventoryUnitId);

      if (uniqueUnitIds.length > 0) {
        await INVENTORY_UNIT.updateMany(
          { _id: { $in: uniqueUnitIds } },
          { $set: { status: "Available", orderId: null } },
        );
      }

      logger.info("Abandoned order cancelled and stock restored", {
        orderId: order._id,
        razorpayOrderId: order.razorpayOrderId,
        itemCount: order.items.length,
      });
    }
  } catch (err) {
    logger.error("Cleanup job failed to clean up abandoned orders", {
      error: err.message,
      stack: err.stack,
    });
  }
};

export const startCleanupJob = () => {
  const INTERVAL_MS = 15 * 60 * 1000;
  setInterval(cleanupAbandonedOrders, INTERVAL_MS);
  logger.info("Cleanup job started", { intervalMinutes: 15 });
};
