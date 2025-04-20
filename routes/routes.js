import { Router } from "express";

// All routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";
import userRouter from "./custom_routes/user-auth.js";
import cartRouter from "./custom_routes/cart-route.js";
import wishlistRouter from "./custom_routes/wishlist-route.js";

export const routes = (app) => {
  const router = Router();

  router.use("/product", productRouter(router));
  router.use("/user", userRouter(router));
  router.use("/cart", cartRouter(router));
  router.use("/wishlist", wishlistRouter(router));

  // Default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  app.use(router);
};
