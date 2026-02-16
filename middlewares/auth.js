import { verifyAccessToken } from "../utils/token.js";
/**
 * Protect routes using Authorization: Bearer <accessToken>
 * On success: attaches req.user = tokenPayload
 */
export const requireAuth = (req, res, next) => {
  try {
    // 1. Check cookies (Priority for security hardened flow)
    let token = req.cookies?.accessToken || req.cookies?.adminAccessToken;

    // 2. Fallback to Authorization header (Backward compatibility)
    if (!token) {
      const authHeader = req.headers.authorization || "";
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const payload = verifyAccessToken(token); // throws on invalid/expired
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};
