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

  // Skip CSRF for the Razorpay webhook — protected by webhook signature instead
  if (
    req.path === "/api/payment/webhook" ||
    req.originalUrl.includes("/payment/webhook")
  ) {
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
  const csrfHeader = req.headers["x-xsrf-token"];

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
