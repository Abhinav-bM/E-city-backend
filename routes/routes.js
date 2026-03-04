import { Router } from "express";
import { globalLimiter, mutationLimiter } from "../middlewares/rate-limit-middleware.js";

// All routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";
import userRouter from "./custom_routes/user-auth.js";
import cartRouter from "./custom_routes/cart-route.js";
import wishlistRouter from "./custom_routes/wishlist-route.js";
import inventoryRouter from "./custom_routes/inventory-routes.js";
import uploadRouter from "./custom_routes/upload-route.js";
import categoryRouter from "./custom_routes/category-route.js";
import brandRouter from "./custom_routes/brand-route.js";
import adminAuthRouter from "./custom_routes/adminAuth-routes.js";
import orderRouter from "./custom_routes/order-route.js";
import paymentRouter from "./custom_routes/payment-route.js";
import returnRouter from "./custom_routes/return-route.js";
import profileRouter from "./custom_routes/user-route.js";

export const routes = (app) => {
  const router = Router();

  // Mount specific routes FIRST (before product's catch-all /:slug)
  router.use("/auth", userRouter());
  router.use("/admin/auth", adminAuthRouter());
  router.use("/upload", uploadRouter());
  router.use("/category", categoryRouter());
  router.use("/cart", mutationLimiter, cartRouter());
  router.use("/wishlist", mutationLimiter, wishlistRouter());
  router.use("/inventory", inventoryRouter());
  router.use("/brand", brandRouter());
  router.use("/order", mutationLimiter, orderRouter());
  router.use("/payment", mutationLimiter, paymentRouter());
  router.use("/return", returnRouter);
  router.use("/profile", mutationLimiter, profileRouter());

  // Mount product LAST because it has catch-all /:slug route
  router.use("/product", productRouter());

  // Default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  // Apply global rate limiter to ALL /api routes as the chokepoint guard
  app.use("/api", globalLimiter, router);
};
