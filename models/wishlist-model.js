import { time } from "console";
import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseProduct",
      required: true,
    },
  },
  { timestamps: true }
);

export const WISHLIST = mongoose.model("Wishlist", WishlistSchema);
