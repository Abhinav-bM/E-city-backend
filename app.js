import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import { connectDB } from "./config/database-config.js";
import { routes } from "./routes/routes.js";
import { csrfProtection } from "./middlewares/csrf-middleware.js";
import morgan from "morgan";

dotenv.config();

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
app.use(express.urlencoded({ extended: false }));
// for parsing json to js object.
app.use(express.json());

import { errorMiddleware } from "./middlewares/error-middleware.js";

routes(app);

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
