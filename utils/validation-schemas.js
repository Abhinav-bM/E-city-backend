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
