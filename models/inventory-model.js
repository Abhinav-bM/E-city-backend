import mongoose from "mongoose";

const InventoryUnitSchema = new mongoose.Schema(
  {
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      index: true,
    },
    // Type of inventory tracking for this unit
    itemType: {
      type: String,
      enum: ["New", "Refurbished", "Open Box", "Used"],
      required: true,
      default: "New",
    },
    // Unique Identification
    serialNumber: {
      type: String,
      trim: true,
      index: true,
    },
    imei: {
      type: String,
      trim: true,
      index: true,
    },
    // Condition Details (Critical for Refurbished)
    conditionGrade: {
      type: String,
      enum: ["Brand New", "Like New", "Excellent", "Good", "Fair"],
      default: "Brand New",
    },
    conditionDescription: {
      type: String, // e.g. "Scratch on bezel, 90% Battery"
    },
    uniqueImages: [
      {
        url: String,
        alt: String,
      },
    ],
    // Pricing Override (e.g., this specific unit is cheaper due to damage)
    priceOverride: {
      type: Number,
    },
    // Status Logic
    status: {
      type: String,
      enum: [
        "Available",
        "Reserved",
        "Sold",
        "Returned",
        "Damaged",
        "In Repair",
      ],
      default: "Available",
      index: true,
    },
    // Location tracking (Warehouse/Store)
    location: {
      type: String,
      default: "Main Warehouse",
    },
    // Audit Trail
    purchaseDate: Date, // When did we buy/acquire this?
    soldDate: Date, // When was it sold?
    orderId: {
      type: String, // Link to Order when sold
      index: true,
    },
    // Soft Delete / Archive flag
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure uniqueness of IMEI/Serial globally, but only if they exist
InventoryUnitSchema.index(
  { imei: 1 },
  {
    unique: true,
    partialFilterExpression: { imei: { $exists: true, $ne: "" } },
  },
);
InventoryUnitSchema.index(
  { serialNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { serialNumber: { $exists: true, $ne: "" } },
  },
);

const INVENTORY_UNIT = mongoose.model("InventoryUnit", InventoryUnitSchema);

export default INVENTORY_UNIT;
