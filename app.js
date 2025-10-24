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
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
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
