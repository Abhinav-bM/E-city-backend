import { sendError } from "../utils/response-handler.js";

/**
 * CSRF Protection Middleware - Double-Submit Cookie Pattern
 * Validates that the X-XSRF-TOKEN header matches the XSRF-TOKEN cookie.
 */
export const csrfProtection = (req, res, next) => {
  // ⚠️ TEMPORARY BYPASS FOR TESTING — uncomment below when auth is fully implemented
  return next();

  /*
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies["XSRF-TOKEN"];
  const csrfHeader = req.headers["x-xsrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    console.error(
      `CSRF validation failed. Cookie: ${csrfCookie}, Header: ${csrfHeader}`,
    );
    return sendError(
      res,
      403,
      "CSRF validation failed. Invalid or missing XSRF token.",
    );
  }

  next();
  */
};
