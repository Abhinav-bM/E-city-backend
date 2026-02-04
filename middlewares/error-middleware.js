import { sendError } from "../utils/response-handler.js";

const errorMiddleware = (err, req, res, next) => {
  // console.error("Global Error:", err);
  // Morgan already logs requests, but we might want to log the full stack trace here for 500s
  if (!err.statusCode || err.statusCode === 500) {
    console.error(err.stack || err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return sendError(res, statusCode, message, err);
};

export { errorMiddleware };
