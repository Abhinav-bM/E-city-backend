import { verifyAccessToken } from "../utils/token.js";

/**
 * Protect Shop routes using accessToken.
 * On success: attaches req.user = tokenPayload
 */
export const requireAuth = (req, res, next) => {
  try {
    // 1. Strictly look for Shop User accessToken
    let token = req.cookies?.accessToken;

    // 2. Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization || "";
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    const payload = verifyAccessToken(token); 
    req.user = payload;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired access token." });
  }
};

/**
 * Protect Dashboard (Admin) routes using adminAccessToken.
 * Automatically verifies the 'admin' role.
 */
export const requireAdminAuth = (req, res, next) => {
  try {
    // 1. Strictly look for Dashboard adminAccessToken
    let token = req.cookies?.adminAccessToken;

    // 2. Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization || "";
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Admin authentication required." });
    }

    const payload = verifyAccessToken(token);

    // 3. Mandatory Role check for Admin
    if (payload.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required." });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired admin access token." });
  }
};

/**
 * Legacy/Shared middleware to ensure the authenticated user has the 'admin' role.
 * (Optional - now mostly handled by requireAdminAuth)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required." });
  }
  next();
};
