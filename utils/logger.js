import { createLogger, format, transports } from "winston";

const { combine, timestamp, errors, json, colorize, printf } = format;

const isProd = process.env.NODE_ENV === "production";

/**
 * Development format: colorized, human-readable, shows stack traces.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}] ${message}${metaStr}${stack ? `\n${stack}` : ""}`;
  }),
);

/**
 * Production format: structured JSON for log aggregators (Datadog, CloudWatch, ELK).
 * Each log line is a single parseable JSON object with timestamp, level, message, and context.
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: isProd ? "info" : "debug",
  format: isProd ? prodFormat : devFormat,
  transports: [new transports.Console()],
  // Prevents Winston from throwing on invalid log data
  exitOnError: false,
});

export default logger;
