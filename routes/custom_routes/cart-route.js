import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../controllers/cart-controller.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validation-middleware.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "../../utils/validation-schemas.js";

const cartRouter = () => {
  const router = Router();
  router.get("/", requireAuth, getCart);
  router.post("/add", requireAuth, validateRequest(addToCartSchema), addToCart);
  router.put(
    "/update",
    requireAuth,
    validateRequest(updateCartItemSchema),
    updateCartItem,
  );
  router.delete(
    "/remove",
    requireAuth,
    validateRequest(removeCartItemSchema),
    removeCartItem,
  );
  router.delete("/clear", requireAuth, clearCart);
  return router;
};

export default cartRouter;
