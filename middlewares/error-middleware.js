import logger from "../utils/logger.js";
import { sendError } from "../utils/response-handler.js";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Handle Mongoose Validation Errors — always a 400, no need to log as error
  if (err.name === "ValidationError") {
    return sendError(res, 400, "Validation failed.", err.message);
  }

  // Handle Mongoose CastError — malformed ObjectId passed in params
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return sendError(res, 400, "Invalid ID format.");
  }

  // For 5xx errors, log with full context so we can diagnose production issues
  if (statusCode >= 500) {
    logger.error("Unhandled server error", {
      route: `${req.method} ${req.originalUrl}`,
      userId: req.user?.userId ?? null,
      ip: req.ip,
      statusCode,
      error: err.message,
      stack: err.stack,
    });
  }

  // For 4xx auth failures, log at warn level for monitoring dashboards
  if (statusCode === 401 || statusCode === 403) {
    logger.warn("Auth failure", {
      route: `${req.method} ${req.originalUrl}`,
      userId: req.user?.userId ?? null,
      ip: req.ip,
      statusCode,
      reason: err.message,
    });
  }

  // In production, never leak raw error details for 500s
  const message =
    statusCode === 500
      ? "An internal server error occurred."
      : err.message || "An error occurred.";

  return sendError(res, statusCode, message);
};

export { errorMiddleware };
