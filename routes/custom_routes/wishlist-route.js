import { Router } from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../../controllers/wishlist-controller.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validation-middleware.js";
import Joi from "joi";

// Inline schema — variant_id must be a valid 24-char hex ObjectId
const wishlistItemSchema = Joi.object({
  variant_id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid variant ID.",
    "string.length": "Invalid variant ID length.",
    "any.required": "variant_id is required.",
  }),
});

const wishlistRouter = () => {
  const router = Router();
  router.get("/", requireAuth, getWishlist);
  router.post(
    "/add",
    requireAuth,
    validateRequest(wishlistItemSchema),
    addToWishlist,
  );
  router.delete(
    "/remove",
    requireAuth,
    validateRequest(wishlistItemSchema),
    removeFromWishlist,
  );

  return router;
};

export default wishlistRouter;
