import { Router } from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../../controllers/wishlist-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const wishlistRouter = () => {
  const router = Router();
  router.get("/", requireAuth, getWishlist);
  router.post("/add", requireAuth, addToWishlist);
  router.delete("/remove", requireAuth, removeFromWishlist);

  return router;
};

export default wishlistRouter;
