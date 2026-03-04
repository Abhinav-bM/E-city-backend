import rateLimit from "express-rate-limit";

/**
 * Standard JSON response for rate limit errors.
 * Keeps the format consistent with the rest of the API.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

/**
 * Global limiter — applies to all /api routes.
 * Protects against general API scraping and flooding.
 * 1500 requests per 15 minutes per IP (loose limit for public data/search).
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Mutation limiter — for user-specific actions (Cart, Wishlist, Profile).
 * 200 requests per 15 minutes per IP.
 */
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Auth limiter — for login and OTP verify endpoints.
 * Prevents brute-force attacks on admin login and OTP guessing.
 * 5 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Count all attempts, not just failures
});

/**
 * OTP send limiter — prevents OTP spam (SMS/call abuse).
 * 3 requests per 10 minutes per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many OTP requests. Please wait before requesting another.",
    });
  },
});
