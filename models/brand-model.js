import mongoose from "mongoose";
import { slugify } from "../utils/misc.js";

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    logo: {
      url: String,
      alt: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Pre-save hook to generate slug
BrandSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
  next();
});

const Brand = mongoose.model("Brand", BrandSchema);
export default Brand;
