import { Router } from "express";
import { createReview, getProductReviews } from "../../controllers/review-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const reviewRouter = () => {
  const router = Router();

  router.post("/", requireAuth, createReview);
  router.get("/:productId", getProductReviews);

  return router;
};

export default reviewRouter;
