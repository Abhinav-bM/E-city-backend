import USER from "../models/user.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import Joi from "joi";

// Address validation schema
const addressSchema = Joi.object({
  fullName: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({ "string.pattern.base": "Phone must be 10 digits" }),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().optional().allow(""),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().default("India"),
  isDefault: Joi.boolean().default(false),
});

// ── User Profile ──────────────────────────────────────────────────────────────
export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await USER.findById(userId).select("-__v");
  if (!user) return sendError(res, 404, "User not found");

  return sendResponse(res, 200, true, "Profile fetched successfully", user);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;

  // Since phone is unique and serves as login, we don't allow changing it here easily.
  const user = await USER.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true, runValidators: true },
  ).select("-__v");

  if (!user) return sendError(res, 404, "User not found");

  return sendResponse(res, 200, true, "Profile updated successfully", user);
});

// ── Address Management ────────────────────────────────────────────────────────
export const addAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { error, value } = addressSchema.validate(req.body);

  if (error) return sendError(res, 400, error.details[0].message);

  const user = await USER.findById(userId);
  if (!user) return sendError(res, 404, "User not found");

  // If this is the first address, or the user marked it as default
  if (value.isDefault || user.addresses.length === 0) {
    value.isDefault = true;
    user.addresses.forEach((addr) => (addr.isDefault = false)); // unset others
  }

  user.addresses.push(value);
  await user.save();

  return sendResponse(
    res,
    201,
    true,
    "Address added successfully",
    user.addresses,
  );
});

export const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { addressId } = req.params;

  const { error, value } = addressSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const user = await USER.findById(userId);
  if (!user) return sendError(res, 404, "User not found");

  const address = user.addresses.id(addressId);
  if (!address) return sendError(res, 404, "Address not found");

  if (value.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  address.set(value);
  await user.save();

  return sendResponse(
    res,
    200,
    true,
    "Address updated successfully",
    user.addresses,
  );
});

export const removeAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { addressId } = req.params;

  const user = await USER.findById(userId);
  if (!user) return sendError(res, 404, "User not found");

  const address = user.addresses.id(addressId);
  if (!address) return sendError(res, 404, "Address not found");

  user.addresses.pull(addressId);

  // If the removed address was default, set the first one as default
  if (address.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return sendResponse(
    res,
    200,
    true,
    "Address removed successfully",
    user.addresses,
  );
});

// ── Admin: Get all users ──────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await USER.find().select("-__v").sort({ createdAt: -1 });
  return sendResponse(res, 200, true, "Users fetched successfully", users);
});
