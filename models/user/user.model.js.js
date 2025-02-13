const mongoose = require("../../config/database");

const userSchema = new mongoose.Schema(
  {
    // Phone number is our primary identifier
    phoneNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ["Admin", "User"], default: "User" },

    // Optional fields that can be filled later
    name: { type: String },
    email: { type: String, unique: true, lowercase: true },

    // // Fields for managing authentication
    // isPhoneVerified: { type: Boolean, default: false },
    // lastOTPRequestTime: { type: Date },
    // otpAttempts: { type: Number, default: 0 },

    // // For blocking users after multiple failed OTP attempts / other reasons
    // isBlocked: { type: Boolean, default: false },
    // blockedUntil: { type: Date },

    // // Refresh token management
    // refreshToken: { type: String },

    // // Basic audit fields
    // createdAt: { type: Date, default: Date.now },
    // updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const user = mongoose.model("user", userSchema, "user");
module.exports = user;
