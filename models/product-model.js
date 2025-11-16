import mongoose from "mongoose";

//Base/parent Product schema
const BaseProductSchema = new mongoose.Schema(
  {
    title: {
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
    images: [
      {
        url: String,
      },
    ],
    variantAttributes: [
      {
        name: { type: String, required: true },
        values: { type: [String], required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes to optimize common listing queries
BaseProductSchema.index({ category: 1 });
BaseProductSchema.index({ brand: 1 });
BaseProductSchema.index({ isActive: 1 });

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
    sellingPrice: {
      type: Number,
      required: true,
    },
    actualPrice: {
      type: Number,
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
    slug: {
      type: String,
      required: true,
      unique : true
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes to speed up variant lookups by base product and default selection
ProductVariantSchema.index({ baseProductId: 1 });
ProductVariantSchema.index({ isDefault: 1 });

const BASE_PRODUCT = mongoose.model("BaseProduct", BaseProductSchema);
const PRODUCT_VARIANT = mongoose.model("ProductVariant", ProductVariantSchema);
export { BASE_PRODUCT, PRODUCT_VARIANT };
