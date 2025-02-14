import mongoose from "../config/database-config";

// schema for product variant
const VariantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
    trim: true,
  },
  ram: {
    size: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["GB", "TB"],
      default: "GB",
    },
  },
  storage: {
    size: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["SSD", "HDD"],
      required: true,
    },
  },
  price: {
    type: Number,
    required: true,
  },
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
});

// schema for product
const ProductSchema = new mongoose.Schema({
  name: {
    type: Number,
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

  basePrice: {
    type: Number,
    required: true,
  },
  specifications: {
    processor: {
      type: String,
      required: true,
    },
    display: {
      size: Number,
      resolution: String,
      type: String,
    },
    camera: {
      main: String,
      front: String,
    },
    battery: {
      capacity: Number,
      type: String,
    },
    connectivity: [String],
    features: [String],
  },
  variant: [VariantSchema],
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      alt: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  ratings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "discontinued"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// pre-save middleware to update the updatedAt timestamp
ProductSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
