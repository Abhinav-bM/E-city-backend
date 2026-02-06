import { Router } from "express";

// All routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";
import userRouter from "./custom_routes/user-auth.js";
import cartRouter from "./custom_routes/cart-route.js";
import wishlistRouter from "./custom_routes/wishlist-route.js";
import inventoryRouter from "./custom_routes/inventory-routes.js";
import uploadRouter from "./custom_routes/upload-route.js";
import categoryRouter from "./custom_routes/category-route.js";

export const routes = (app) => {
  const router = Router();

  router.use("/auth", userRouter(router));
  router.use("/upload", uploadRouter(router));

  router.use("/product", productRouter(router));
  router.use("/category", categoryRouter());
  router.use("/cart", cartRouter(router));
  router.use("/wishlist", wishlistRouter(router));
  router.use("/inventory", inventoryRouter(router));

  // Default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  app.use("/api", router);
};
