import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import { connectDB } from "./config/database-config.js";
import { routes } from "./routes/routes.js";
import { csrfProtection } from "./middlewares/csrf-middleware.js";
import { globalLimiter } from "./middlewares/rate-limit-middleware.js";
import morgan from "morgan";

dotenv.config();

// Step 12: Startup env validation.
// The server refuses to start if any critical secret is missing.
// This prevents silently running in production with placeholder values,
// broken JWT signing, or misconfigured payment webhook verification.
const REQUIRED_ENV = [
  "RAZORPAY_ID_KEY",
  "RAZORPAY_SECRET_KEY",
  "RAZORPAY_WEBHOOK_SECRET",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MONGODB_URI",
  "SESSION_SECRET",
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `FATAL: Missing required environment variable: "${key}". ` +
        `Server cannot start without it. Check your .env file.`,
    );
  }
}

const app = express();

// Security headers — must be first middleware.
// Sets X-Frame-Options, X-Content-Type-Options, HSTS, and more.
app.use(helmet());

// Use 'combined' format in production (standard Apache log, safe for log aggregators).
// 'dev' format uses colours and verbose output — not suitable for production log shipping.
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// connect to MongoDB
connectDB();
const FRONTEND_URL_USER = process.env.FRONTEND_URL;
const FRONTEND_URL_ADMIN = process.env.FRONTEND_URL_ADMIN;

// Build the CORS origin list. localhost is ONLY added in non-production.
// Hardcoding it unconditionally would allow dev machines to bypass strict CORS in prod.
const allowedOrigins = [FRONTEND_URL_USER, FRONTEND_URL_ADMIN].filter(Boolean);
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-XSRF-TOKEN",
    ],
  }),
);
app.use(cookieParser());

app.use(csrfProtection);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored — GDPR-safer
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS-only in production
      httpOnly: true, // Prevent JS access to session cookie
      sameSite: "lax",
    },
  }),
);
//same use of body parser. its built in express itself.
// Explicit 10kb limit prevents large-body DoS attacks.
app.use(express.urlencoded({ limit: "10kb", extended: false }));
// for parsing json to js object.
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

// Sanitize all incoming data to remove MongoDB operator injection ($, .)
// This protects req.body, req.params, and req.query globally.
app.use(mongoSanitize());

import { errorMiddleware } from "./middlewares/error-middleware.js";
import { startCleanupJob } from "./services/cleanup-service.js";

routes(app);

// Start background cleanup jobs
startCleanupJob();

// Default route - homepage
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Global Error Handler (Must be last)
app.use(errorMiddleware);

// starting server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on : http://localhost:${port}`);
});
