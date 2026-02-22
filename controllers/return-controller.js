import RETURN_REQUEST from "../models/return-model.js";
import ORDER from "../models/order-model.js";
import { PRODUCT_VARIANT } from "../models/product-model.js";
import INVENTORY_UNIT from "../models/inventory-model.js";
import {
  createReturnSchema,
  updateReturnStatusSchema,
} from "../utils/validation-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendResponse, sendError } from "../utils/response-handler.js";

// ── Customer: Request a Return ───────────────────────────────────────────────
export const requestReturn = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Validate request body using Joi
  const { error, value } = createReturnSchema.validate(req.body);
  if (error) {
    return sendError(res, 400, error.details[0].message);
  }

  const { orderId, items } = value;

  // Verify the order belongs to the user and is Delivered
  const order = await ORDER.findById(orderId);
  if (!order) return sendError(res, 404, "Order not found");
  if (order.userId.toString() !== userId)
    return sendError(res, 403, "Access denied");

  if (order.orderStatus !== "Delivered") {
    return sendError(res, 400, "Only delivered orders can be returned");
  }

  // Check if a return request already exists for this order
  const existingReturn = await RETURN_REQUEST.findOne({
    orderId,
    userId,
    status: { $ne: "Rejected" },
  });
  if (existingReturn) {
    return sendError(
      res,
      400,
      "An active return request already exists for this order",
    );
  }

  // Calculate refund amount based on items returned
  let refundAmount = 0;
  for (const item of items) {
    refundAmount += item.priceAtOrder * item.quantity;
  }

  // Create the return request
  const newReturn = new RETURN_REQUEST({
    orderId,
    userId,
    items,
    refundAmount,
    status: "Pending", // Explicitly setting though it defaults to Pending
  });

  await newReturn.save();

  return sendResponse(
    res,
    201,
    true,
    "Return request submitted successfully",
    newReturn,
  );
});

// ── Customer: Get My Returns ─────────────────────────────────────────────────
export const getMyReturns = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const returns = await RETURN_REQUEST.find({ userId })
    .populate("orderId", "totalAmount createdAt paymentMethod")
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, "Returns fetched successfully", returns);
});

// ── Admin: Get All Returns ───────────────────────────────────────────────────
export const getAllReturns = asyncHandler(async (req, res) => {
  const returns = await RETURN_REQUEST.find()
    .populate("userId", "name email phone")
    .populate("orderId", "_id paymentMethod createdAt")
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, "All returns fetched", returns);
});

// ── Admin: Update Return Status ──────────────────────────────────────────────
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { returnId } = req.params;

  const { error, value } = updateReturnStatusSchema.validate(req.body);
  if (error) {
    return sendError(res, 400, error.details[0].message);
  }

  const { status, adminNotes } = value;

  const returnRequest = await RETURN_REQUEST.findById(returnId);
  if (!returnRequest) return sendError(res, 404, "Return request not found");

  // If already refunded, don't allow changing back
  if (returnRequest.status === "Refunded") {
    return sendError(
      res,
      400,
      "Cannot change status of an already refunded return",
    );
  }

  returnRequest.status = status;
  if (adminNotes !== undefined) {
    returnRequest.adminNotes = adminNotes;
  }

  // If approved/refunded, handle inventory restoration
  if (status === "Approved" || status === "Refunded") {
    const order = await ORDER.findById(returnRequest.orderId);

    if (order) {
      // Revert inventory
      for (const returnItem of returnRequest.items) {
        if (!returnItem.inventoryUnitId) {
          // Quantity based
          await PRODUCT_VARIANT.findByIdAndUpdate(returnItem.productVariantId, {
            $inc: { stock: returnItem.quantity },
          });
        }
      }

      // Unique IMS items
      const uniqueUnitIds = returnRequest.items
        .filter((i) => i.inventoryUnitId)
        .map((i) => i.inventoryUnitId);

      if (uniqueUnitIds.length > 0) {
        await INVENTORY_UNIT.updateMany(
          { _id: { $in: uniqueUnitIds } },
          { $set: { status: "Available", orderId: null } },
        );
      }

      // We don't change the main Order status to 'Cancelled' because it was delivered,
      // but we could set it to 'Returned' if that was an option. For now, leaving as Delivered is fine.
    }
  }

  await returnRequest.save();

  return sendResponse(res, 200, true, "Return status updated", returnRequest);
});
