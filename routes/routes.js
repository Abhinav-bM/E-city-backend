import { Router } from "express";

// import all routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";
import userRouter from "./custom_routes/user-auth.js";
import cartRouter from "./custom_routes/cart-route.js";

export const routes = (app) => {
  const router = Router();

  router.use("/api/product", productRouter(router));
  router.use("/api/user", userRouter(router));
  router.use("/api/cart", cartRouter(router));

  // default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  app.use(router);
};
