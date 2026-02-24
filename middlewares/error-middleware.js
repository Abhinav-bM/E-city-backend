import { sendError } from "../utils/response-handler.js";

const errorMiddleware = (err, req, res, next) => {
  // console.error("Global Error:", err);
  // Morgan already logs requests, but we might want to log the full stack trace here for 500s
  if (!err.statusCode || err.statusCode === 500) {
    console.error(err.stack || err);
  }

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    return sendError(res, 400, "Validation failed.", err.message);
  }

  // Handle Mongoose CastError — malformed ObjectId passed in params
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return sendError(res, 400, "Invalid ID format.");
  }

  const statusCode = err.statusCode || 500;
  // In production, never leak raw error objects for 500s
  const message =
    statusCode === 500
      ? "An internal server error occurred."
      : err.message || "An error occurred.";

  return sendError(res, statusCode, message);
};

export { errorMiddleware };
