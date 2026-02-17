import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtAdd: {
    type: Number,
    required: true,
  },
});

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [CartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const CART = mongoose.model("Cart", CartSchema);

export default CART;
