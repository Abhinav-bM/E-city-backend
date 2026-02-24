import Admin from "../models/admin-model.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  setAccessTokenCookie,
  setXsrfTokenCookie,
} from "../utils/token.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";
import crypto from "crypto";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email, isActive: true });
  if (!admin) {
    return sendError(res, 401, "Invalid credentials or account inactive");
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 401, "Invalid credentials");
  }

  // Embed the current tokenVersion so logout can increment and invalidate all sessions.
  const payload = {
    userId: admin._id,
    role: "admin",
    version: admin.refreshTokenVersion,
  };
  const accessToken = createAccessToken({ userId: admin._id, role: "admin" });
  const refreshToken = createRefreshToken(payload);

  setRefreshTokenCookie(
    res,
    refreshToken,
    "adminRefreshToken",
    "/api/admin/auth/refresh",
  );
  setAccessTokenCookie(res, accessToken, "adminAccessToken");

  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);

  return sendResponse(res, 200, true, "Login successful", {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.adminRefreshToken;
  if (!refreshToken) {
    return sendError(res, 401, "No refresh token provided");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return sendError(res, 401, "Invalid or expired refresh token");
  }

  const admin = await Admin.findById(payload.userId);
  if (!admin || !admin.isActive) {
    return sendError(res, 401, "Admin not found or inactive");
  }

  // Version check — if admin logged out, refreshTokenVersion was incremented.
  // Any stolen tokens with an old version are now invalid.
  if (payload.version !== admin.refreshTokenVersion) {
    return sendError(res, 401, "Session expired. Please log in again.");
  }

  const newPayload = {
    userId: admin._id,
    role: "admin",
    version: admin.refreshTokenVersion,
  };
  const newAccessToken = createAccessToken({
    userId: admin._id,
    role: "admin",
  });
  const newRefreshToken = createRefreshToken(newPayload);

  setRefreshTokenCookie(
    res,
    newRefreshToken,
    "adminRefreshToken",
    "/api/admin/auth/refresh",
  );
  setAccessTokenCookie(res, newAccessToken, "adminAccessToken");

  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);

  return sendResponse(res, 200, true, "Token refreshed successfully");
});

export const logout = asyncHandler(async (req, res) => {
  // Increment refreshTokenVersion to invalidate all existing refresh tokens.
  // Any stolen cookie with the old version will fail the next refresh check.
  const tokenCookie = req.cookies?.adminRefreshToken;
  if (tokenCookie) {
    try {
      const payload = verifyRefreshToken(tokenCookie);
      await Admin.findByIdAndUpdate(payload.userId, {
        $inc: { refreshTokenVersion: 1 },
      });
    } catch {
      // Token already invalid — still clear cookies
    }
  }

  res.clearCookie("adminRefreshToken", { path: "/api/admin/auth/refresh" });
  res.clearCookie("adminAccessToken", { path: "/" });
  res.clearCookie("XSRF-TOKEN", { path: "/" });
  return sendResponse(res, 200, true, "Logged out successfully");
});

export const getMe = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user.userId);
  if (!admin) {
    return sendError(res, 404, "Admin not found");
  }
  return sendResponse(res, 200, true, "Admin details fetched", {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  });
});

export const getCsrfAdminToken = asyncHandler(async (req, res) => {
  const xsrfToken = crypto.randomBytes(32).toString("hex");
  setXsrfTokenCookie(res, xsrfToken);
  return sendResponse(res, 200, true, "CSRF token generated successfully");
});
