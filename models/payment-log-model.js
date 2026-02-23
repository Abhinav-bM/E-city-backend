import mongoose from "mongoose";

/**
 * PaymentLog — immutable audit trail for every payment event.
 *
 * Records are append-only. Never update or delete these.
 * Used for: dispute resolution, debugging, financial reconciliation.
 *
 * event values:
 *   "verify_attempt"       — client called /payment/verify
 *   "webhook_captured"     — Razorpay webhook: payment.captured / order.paid
 *   "webhook_failed"       — Razorpay webhook: payment.failed
 *   "amount_mismatch"      — amount in webhook != order.totalAmount
 *
 * status values: "success" | "failure"
 */
const PaymentLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    event: {
      type: String,
      required: true,
      enum: [
        "verify_attempt",
        "webhook_captured",
        "webhook_failed",
        "amount_mismatch",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failure"],
    },
    message: {
      type: String,
    },
    ip: {
      type: String, // Client IP for verify_attempt events
    },
    meta: {
      type: Object, // Raw payload data for debugging
      default: {},
    },
  },
  {
    timestamps: true,
    // Prevent accidental updates — these records are write-once
    strict: true,
  },
);

// TTL: auto-delete logs older than 2 years (adjust to your compliance needs)
PaymentLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);

export default PaymentLog;
