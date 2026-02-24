import Joi from "joi";

export const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Phone number must be strictly 10 digits",
      "string.pattern.base": "Phone number must contain only digits",
    }),
});

export const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits",
    }),
});

export const createReturnSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid order ID format",
    "string.length": "Invalid order ID length",
  }),
  items: Joi.array()
    .items(
      Joi.object({
        productVariantId: Joi.string().hex().length(24).required(),
        inventoryUnitId: Joi.string()
          .hex()
          .length(24)
          .optional()
          .allow(null, ""),
        title: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        priceAtOrder: Joi.number().min(0).required(),
        reason: Joi.string()
          .valid(
            "Defective/Damaged",
            "Wrong Item Delivered",
            "Not as Described",
            "Changed My Mind",
            "Other",
          )
          .required(),
        details: Joi.string().max(500).optional().allow(""),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one item must be returned",
    }),
});

export const updateReturnStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Approved", "Rejected", "Refunded")
    .required(),
  adminNotes: Joi.string().max(500).optional().allow(""),
});

// ─── Cart schemas ─────────────────────────────────────────────────────────────

const objectIdString = Joi.string().hex().length(24);

export const addToCartSchema = Joi.object({
  baseProductId: objectIdString.optional(),
  variantId: objectIdString.optional(),
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Quantity must be a number.",
    "number.integer": "Quantity must be a whole number.",
    "number.min": "Quantity must be at least 1.",
    "number.max": "Quantity cannot exceed 100.",
  }),
}).or("baseProductId", "variantId"); // at least one must be present

export const updateCartItemSchema = Joi.object({
  variantId: objectIdString.required().messages({
    "string.hex": "Invalid variant ID.",
    "string.length": "Invalid variant ID length.",
  }),
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Quantity must be a number.",
    "number.integer": "Quantity must be a whole number.",
    "number.min": "Quantity must be at least 1.",
    "number.max": "Quantity cannot exceed 100.",
  }),
});

export const removeCartItemSchema = Joi.object({
  variantId: objectIdString.required().messages({
    "string.hex": "Invalid variant ID.",
    "string.length": "Invalid variant ID length.",
  }),
});

// ─── Order schemas ────────────────────────────────────────────────────────────

const shippingAddressSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required(),
  addressLine1: Joi.string().trim().min(5).max(200).required(),
  addressLine2: Joi.string().trim().max(200).optional().allow(""),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  pincode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
  country: Joi.string().trim().min(2).max(100).optional().default("India"),
}).unknown(true); // allow address _id if re-used

export const placeOrderSchema = Joi.object({
  shippingAddress: shippingAddressSchema.optional(),
  paymentMethod: Joi.string()
    .valid("COD", "Razorpay")
    .optional()
    .default("COD"),
  notes: Joi.string().max(500).optional().allow(""),
  existingOrderId: objectIdString.optional().allow(null, ""),
}).or("shippingAddress", "existingOrderId");

export const placeDirectOrderSchema = Joi.object({
  shippingAddress: shippingAddressSchema.optional(),
  paymentMethod: Joi.string()
    .valid("COD", "Razorpay")
    .optional()
    .default("COD"),
  notes: Joi.string().max(500).optional().allow(""),
  existingOrderId: objectIdString.optional().allow(null, ""),
  directItems: Joi.array()
    .items(
      Joi.object({
        productVariantId: objectIdString.required(),
        quantity: Joi.number().integer().min(1).max(100).required(),
      }),
    )
    .min(1)
    .required()
    .messages({ "array.min": "At least one item is required." }),
}).or("shippingAddress", "existingOrderId");
