import jwt from "jsonwebtoken";

export const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

export const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const setRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd, // true on production (HTTPS)
    sameSite: "strict", // prevent CSRF to some extent
    path: "/api/auth/refresh", // limit cookie to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (ms) — should match refresh token expiry
  });
};

export const setAccessTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax", // Better for cross-site link navigation while still providing some protection
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 mins (ms) - matches ACCESS_TOKEN_EXPIRES_IN default
  });
};

export const setXsrfTokenCookie = (res, token) => {
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false, // Must be readable by frontend JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};
