import { sendError } from "../utils/response-handler.js";

/**
 * CSRF Protection Middleware — Double-Submit Cookie Pattern
 *
 * Step 11: CSRF protection re-enabled. The /api/payment/webhook path is
 * explicitly excluded because it is called by Razorpay's servers (not a
 * browser), so it will never have a CSRF cookie to submit. The webhook
 * is protected instead by HMAC-SHA256 signature verification.
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for safe HTTP methods
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  
  console.log("[CSRF Debug] originalUrl:", req.originalUrl, "path:", req.path);

  // Skip CSRF for the Razorpay webhook — protected by webhook signature instead
  if (
    req.path === "/api/payment/webhook" ||
    req.originalUrl.includes("/payment/webhook")
  ) {
    return next();
  }

  // Skip CSRF for Auth entry/exit points to prevent login/logout deadlocks
  const skipAuthRoutes = [
    "/api/auth/login",
    "/api/admin/auth/login",
    "/api/auth/logout",
    "/api/admin/auth/logout",
    "/api/auth/refresh",
    "/api/admin/auth/refresh",
  ];
  if (skipAuthRoutes.some(route => req.originalUrl.includes(route))) {
    return next();
  }

  // NEW: Skip CSRF if the request is unauthenticated.
  // CSRF is only a threat when there is an active session/cookie to hijack.
  // If no auth tokens are present, this is a public request (like Login/Register).
  const authCookie = req.cookies["accessToken"];
  const adminAuthCookie = req.cookies["adminAccessToken"];

  if (!authCookie && !adminAuthCookie) {
    return next();
  }

  const csrfCookie = req.cookies["XSRF-TOKEN"];
  const csrfHeader =
    req.headers["x-xsrf-token"] ||
    req.headers["x-csrf-token"] ||
    req.headers["X-XSRF-TOKEN"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    console.error(
      `[CSRF] Validation failed. Cookie: ${csrfCookie ? "present" : "missing"}, Header: ${csrfHeader ? "present" : "missing"}`,
    );
    return sendError(
      res,
      403,
      "CSRF validation failed. Invalid or missing XSRF token.",
    );
  }

  next();
};
