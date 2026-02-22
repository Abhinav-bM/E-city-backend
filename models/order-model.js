import mongoose from "mongoose";

// ── Shipping Address ──────────────────────────────────────────────────────────
const ShippingAddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false },
);

// ── Order Item ────────────────────────────────────────────────────────────────
const OrderItemSchema = new mongoose.Schema(
  {
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    baseProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseProduct",
      required: true,
    },
    // For Unique/Refurbished items — the specific InventoryUnit reserved
    inventoryUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryUnit",
      default: null,
    },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }, // snapshot price at time of order
    title: { type: String }, // snapshot title
    attributes: { type: Object, default: {} }, // snapshot variant attributes
  },
  { _id: false },
);

// ── Order ─────────────────────────────────────────────────────────────────────
const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    shippingAddress: { type: ShippingAddressSchema, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "Razorpay"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
      index: true,
    },
    razorpayOrderId: { type: String }, // set when Razorpay used
    razorpayPaymentId: { type: String },

    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
      index: true,
    },

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    notes: { type: String }, // optional customer notes
  },
  { timestamps: true },
);

const ORDER = mongoose.model("Order", OrderSchema);

export default ORDER;
