import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema({
  productVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product_Variant",
    required: true,
  },
  inventoryUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory_Unit",
    required: false, // Only for "Unique" items
  },
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtOrder: { type: Number, required: true },
  reason: {
    type: String,
    enum: [
      "Defective/Damaged",
      "Wrong Item Delivered",
      "Not as Described",
      "Changed My Mind",
      "Other",
    ],
    required: true,
  },
  details: {
    type: String,
    maxLength: 500,
  },
});

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [returnItemSchema],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Refunded"],
      default: "Pending",
    },
    adminNotes: {
      type: String,
      maxLength: 500,
      default: "",
    },
    refundAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const RETURN_REQUEST = mongoose.model("ReturnRequest", returnRequestSchema);
export default RETURN_REQUEST;
