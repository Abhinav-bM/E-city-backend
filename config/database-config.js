import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected", { host: conn.connection.host });
  } catch (error) {
    logger.error("MongoDB initial connection failed", { error: error.message });
    process.exit(1);
  }
};

// Monitor connection health after initial connect.
// These fire for transient drops (network blip, Atlas failover, etc.)
mongoose.connection.on("disconnected", () => {
  logger.warn(
    "MongoDB disconnected — Mongoose will attempt reconnect automatically.",
  );
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected.");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", { error: err.message });
});
