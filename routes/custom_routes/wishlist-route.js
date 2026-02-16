import { Router } from "express";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../controllers/wishlist-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const wishlistRouter = () => {
  const router = Router();
  router.post("/add", requireAuth, addToWishlist);
  router.delete("/remove", requireAuth, removeFromWishlist);

  return router;
};

export default wishlistRouter;
