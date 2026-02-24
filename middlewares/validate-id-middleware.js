import mongoose from "mongoose";

/**
 * Middleware factory that validates a URL param is a valid MongoDB ObjectId.
 * Returns 400 immediately if invalid, preventing Mongoose CastErrors in controllers.
 *
 * @param {string} paramName - The req.params key to validate. Defaults to "id".
 * Usage:
 *   router.get("/:id", validateObjectId(), controller);
 *   router.put("/:returnId/status", validateObjectId("returnId"), controller);
 */
export const validateObjectId =
  (paramName = "id") =>
  (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format.",
      });
    }
    next();
  };
