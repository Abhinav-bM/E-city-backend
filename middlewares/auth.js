import { verifyAccessToken } from "../utils/token.js";
/**
 * Protect routes using Authorization: Bearer <accessToken>
 * On success: attaches req.user = tokenPayload
 */
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Missing access token" });

    const payload = verifyAccessToken(token); // throws on invalid/expired
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};
