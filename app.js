import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import { connectDB } from "./config/database-config.js";
import { routes } from "./routes/routes.js";

dotenv.config();

const app = express();

// connect to MongoDB
connectDB();
const FRONTEND_URL_USER = process.env.FRONTEND_URL;
const FRONTEND_URL_ADMIN = process.env.FRONTEND_URL_ADMIN;


app.use(
  cors({
    origin: [FRONTEND_URL_USER, FRONTEND_URL_ADMIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true for https only
  })
);
//same use of body parser. its built in express itself.
app.use(express.urlencoded({ extended: false }));
// for parsing json to js object.
app.use(express.json());

routes(app);

// starting server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on : http://localhost:${port}`);
});
