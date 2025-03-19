import { Router } from "express";

// import all routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";
import userRouter from "./custom_routes/user-auth.js";

export const routes = (app) => {
  const router = Router();

  router.use("/api/product", productRouter(router));
  router.use("/user", userRouter(router));

  // default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  app.use(router);
};
