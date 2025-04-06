import mongoose from "mongoose";

//Base/parent Product schema
const BaseProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      require: true,
      trim: true,
    },
    description: {
      type: String,
      require: true,
    },
    category: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    variantAttributes: [
      {
        name: { type: String, required: true },
        values: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Product Variant Schema (each variant is a separate product)
const ProductVariantSchema = new mongoose.Schema(
  {
    baseProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseProduct",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    attributes: {
      type: Object,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    compareAtPrice: {
      type: Number,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
        },
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    weight: {
      type: Number,
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BASE_PRODUCT = mongoose.model("BaseProduct", BaseProductSchema);
const PRODUCT_VARIANT = mongoose.model("ProductVariant", ProductVariantSchema);
export { BASE_PRODUCT, PRODUCT_VARIANT };
