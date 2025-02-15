import { Router } from "express";

// import all routes from the custom_routes folder
import productRouter from "./custom_routes/product-route.js";

export const routes = (app) => {
  const router = Router();

  router.use("/api/product", productRouter);

  // default route - homepage
  router.use("/", (req, res) => {
    res.send("welcome to home page");
  });

  app.use(router);
};
