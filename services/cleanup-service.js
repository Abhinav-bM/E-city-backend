import ORDER from "../models/order-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";

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

      console.log(
        `[Cleanup] Abandoned Razorpay order ${order._id} cancelled and stock safely restored.`,
      );
    }
  } catch (err) {
    console.error(`[Cleanup Error] Failed to clean up abandoned orders:`, err);
  }
};

export const startCleanupJob = () => {
  // Run the check every 15 minutes natively in the Node process
  const INTERVAL_MS = 15 * 60 * 1000;
  setInterval(cleanupAbandonedOrders, INTERVAL_MS);
  console.log(
    "[Cleanup] Background job started to clean up abandoned Razorpay orders every 15 minutes.",
  );
};
