import mongoose from "mongoose";

// Schema for product variant
const VariantSchema = new mongoose.Schema({
  attributes: {
    type: Object,
    // required: true,
  },
  price: {
    type: Number,
    // required: true,
  },
  images: [
    {
      url: {
        type: String,
        // required: true,
      },
    },
  ],
  stock: {
    type: Number,
    // required: true,
    default: 0,
  },
  sku: {
    type: String,
    // required: true,
    unique: true,
  },
});

// Schema for product
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
      },
    ],
    basePrice: {
      type: Number,
      required: true,
    },
    variantAttributes: [
      {
        name: {
          type: String,
          required: true,
        },
        values: {
          type: [String],
          required: true,
        },
      },
    ],
    variants: [VariantSchema],
  },
  {
    timestamps: true,
  }
);

const PRODUCT = mongoose.model("Product", ProductSchema);

export default PRODUCT;
