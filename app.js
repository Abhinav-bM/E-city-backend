import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import { connectDB } from "./config/database-config.js";
import { routes } from "./routes/routes.js";
import { csrfProtection } from "./middlewares/csrf-middleware.js";
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
app.use(morgan("dev"));

// connect to MongoDB
connectDB();
const FRONTEND_URL_USER = process.env.FRONTEND_URL;
const FRONTEND_URL_ADMIN = process.env.FRONTEND_URL_ADMIN;

app.use(
  cors({
    origin: [FRONTEND_URL_USER, FRONTEND_URL_ADMIN, "http://localhost:3000"],
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
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true for https only
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
