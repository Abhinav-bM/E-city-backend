import mongoose from "mongoose";

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
  images: [
    {
      url: {
        type: String,
        required: true,
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
});

// schema for product
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
    specifications: {
      processor: {
        type: String,
      },
      display: {
        size: {
          type: Number,
        },
        resolution: {
          type: String,
        },
      },
      camera: {
        main: {
          type: String,
        },
        front: {
          type: String,
        },
      },
      battery: {
        capacity: {
          type: Number,
        },
        batteryType: {
          type: String,
        },
      },
      connectivity: [String],
      features: [String],
    },
    variant: [VariantSchema],
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
  },
  {
    timestamps: true,
  }
);

const PRODUCT = mongoose.model("Product", ProductSchema);

export default PRODUCT;
