import USER from "../models/user.js";
import {
  generateOTP,
  sendOtp,
  storeOtp,
  verifyOtp as verifyOtpHelper,
} from "../utils/otp-helper.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  setAccessTokenCookie,
  setXsrfTokenCookie,
} from "../utils/token.js";
import crypto from "crypto";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

const otpStore = new Map();

// login with otp
export const sentOtp = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body); // Debugging line
  const { phone } = req.body;
  if (!phone) return sendError(res, 400, "Phone number required");

  let user = await USER.findOne({ phone });

  if (!user) {
    user = new USER({ phone });
    await user.save();
  }

  if (user) {
    // const otp = generateOTP();
    // await storeOtp(user._id, otp);
    // await sendOtp(phone, otp);

    const otp = "123456";
    otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    return sendResponse(res, 200, true, "OTP sent successfully", null);
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !/^\d{10}$/.test(phone)) {
    return sendError(res, 400, "Invalid phone number");
  }

  if (!otp || !/^\d{6}$/.test(otp)) {
    return sendError(res, 400, "Invalid OTP format");
  }

  if (!phone || !otp) return sendError(res, 400, "Phone and OTP required");

  // Find user first to get the ID for Redis lookup
  let user = await USER.findOne({ phone });
  if (!user) {
    return sendError(res, 400, "User not found");
  }

  // const isValid = await verifyOtpHelper(user._id, otp);
  // if (!isValid) {
  //   return sendError(res, 400, "Invalid or expired OTP");
  // }

  const record = otpStore.get(phone);
  if (!record) return sendError(res, 400, "OTP expired or not found");
  if (record.otp !== otp) return sendError(res, 400, "Invalid OTP");
  if (record.expires < Date.now()) {
    otpStore.delete(phone);
    return sendError(res, 400, "OTP expired");
  }
  otpStore.delete(phone); // remove used OTP

  // if otp is valid generate jwt
  const accessToken = createAccessToken({ userId: user._id });
  const refreshToken = createRefreshToken({ userId: user._id });

  // No need to manually delete from Redis, it expires automatically (or we could del if we want one-time use)

  setRefreshTokenCookie(res, refreshToken);
  setAccessTokenCookie(res, accessToken);

  // Generate a random CSRF token
  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);

  // After verifying OTP successfully
  return sendResponse(res, 200, true, "OTP verified successfully", {
    user: {
      userId: user._id,
      phone: user.phone,
      name: user.name,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sendError(res, 401, "No refresh token provided");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return sendError(res, 401, "Invalid or expired refresh token");
  }

  const user = await USER.findById(payload.userId);
  if (!user) return sendError(res, 401, "User not found");

  const newPayload = { userId: user._id };
  const newAccessToken = createAccessToken(newPayload);
  const newRefreshToken = createRefreshToken(newPayload);

  setRefreshTokenCookie(res, newRefreshToken);
  setAccessTokenCookie(res, newAccessToken);

  // Regenerate CSRF token on refresh
  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);

  return sendResponse(
    res,
    200,
    true,
    "Refresh token refreshed successfully",
    null,
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("XSRF-TOKEN", { path: "/" });
  return sendResponse(res, 200, true, "Logged out successfully");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await USER.findById(req.user.userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }
  return sendResponse(res, 200, true, "User details fetched successfully", {
    user: {
      userId: user._id,
      phone: user.phone,
      name: user.name,
    },
  });
});

export const getCsrfToken = asyncHandler(async (req, res) => {
  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);
  return sendResponse(res, 200, true, "CSRF token generated successfully");
});
