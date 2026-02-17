import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../controllers/cart-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const cartRouter = () => {
  const router = Router();
  router.get("/", requireAuth, getCart);
  router.post("/add", requireAuth, addToCart);
  router.put("/update", requireAuth, updateCartItem);
  router.delete("/remove", requireAuth, removeCartItem);
  router.delete("/clear", requireAuth, clearCart);
  return router;
};

export default cartRouter;
