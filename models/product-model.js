import mongoose from "mongoose";
import { slugify } from "../utils/misc";

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
      unique: true,
      lowercase: true,
      trim: true,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Generate slug from title and attributes to ensure uniqueness
ProductVariantSchema.pre("save", async function (next) {
  // Only generate slug if it's a new document or title/attributes have changed
  if (this.isNew || this.isModified("title") || this.isModified("attributes")) {
    // Build slug from title + variant attributes for uniqueness and SEO
    let slugBase = slugify(this.title);

    // Append variant attributes to make slug unique and descriptive
    // e.g., "product-name-red-large" instead of just "product-name"
    if (this.attributes && typeof this.attributes === "object") {
      const attributeValues = Object.values(this.attributes)
        .filter((val) => val) // Remove null/undefined values
        .map((val) => slugify(String(val)))
        .join("-");

      if (attributeValues) {
        slugBase = `${slugBase}-${attributeValues}`;
      }
    }

    // Ensure uniqueness by checking database and appending number if needed
    let finalSlug = slugBase;
    let counter = 1;
    const ProductVariant = this.constructor;

    // Check if slug already exists (excluding current document if updating)
    const query = { slug: finalSlug };
    if (!this.isNew) {
      query._id = { $ne: this._id };
    }

    while (await ProductVariant.findOne(query)) {
      finalSlug = `${slugBase}-${counter}`;
      query.slug = finalSlug;
      counter++;
    }

    this.slug = finalSlug;
  }
  next();
});

// Indexes to speed up variant lookups by base product and default selection
ProductVariantSchema.index({ baseProductId: 1 });
ProductVariantSchema.index({ isDefault: 1 });
ProductVariantSchema.index({ slug: 1 }); // Index for faster slug lookups

const BASE_PRODUCT = mongoose.model("BaseProduct", BaseProductSchema);
const PRODUCT_VARIANT = mongoose.model("ProductVariant", ProductVariantSchema);
export { BASE_PRODUCT, PRODUCT_VARIANT };
