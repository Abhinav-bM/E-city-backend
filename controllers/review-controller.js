import REVIEW from "../models/review-model.js";
import ORDER from "../models/order-model.js";
import USER from "../models/user.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import Joi from "joi";

const reviewSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string().required(),
  orderId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  headline: Joi.string().trim().min(3).max(100).required(),
  body: Joi.string().trim().min(5).max(1000).required(),
  photos: Joi.array().items(Joi.string().uri()).optional().default([]),
});

/**
 * createReview
 * Creates a verified review for a product.
 * Requires that user has bought the item and the order status is "Delivered".
 */
export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { error, value } = reviewSchema.validate(req.body);

  if (error) {
    return sendError(res, 400, error.details[0].message);
  }

  const { productId, variantId, orderId, rating, headline, body, photos } = value;

  // 1. Verify that the order exists, belongs to user, is Delivered, and contains this product variant
  const order = await ORDER.findOne({
    _id: orderId,
    userId: userId,
    orderStatus: "Delivered",
  });

  if (!order) {
    return sendError(
      res,
      400,
      "You can only review items from orders that have been successfully delivered."
    );
  }

  const hasItem = order.items.some(
    (item) => item.productVariantId.toString() === variantId && item.baseProductId.toString() === productId
  );

  if (!hasItem) {
    return sendError(res, 400, "This product was not found in the specified order.");
  }

  // 2. Check for duplicate reviews (one review per order item)
  const existingReview = await REVIEW.findOne({
    userId,
    orderId,
    variantId,
  });

  if (existingReview) {
    return sendError(res, 400, "You have already reviewed this item for this order.");
  }

  // 3. Create the review
  const newReview = await REVIEW.create({
    userId,
    productId,
    variantId,
    orderId,
    rating,
    headline,
    body,
    photos,
  });

  // Return the created review
  return sendResponse(res, 201, true, "Review submitted successfully", newReview);
});

/**
 * getProductReviews
 * Fetches all reviews for a base product, returning reviews + average summary stats.
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return sendError(res, 400, "Product ID is required.");
  }

  // Fetch reviews and populate reviewer name
  const reviews = await REVIEW.find({ productId })
    .populate("userId", "name")
    .sort({ createdAt: -1 });

  // Calculate summary metrics
  const reviewCount = reviews.length;
  let averageRating = 0;

  if (reviewCount > 0) {
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    averageRating = Number((sum / reviewCount).toFixed(1));
  }

  // Group ratings count (e.g. 5-star count, 4-star count, etc.)
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const ratingKey = r.rating;
    if (ratingDistribution[ratingKey] !== undefined) {
      ratingDistribution[ratingKey]++;
    }
  });

  return sendResponse(res, 200, true, "Reviews fetched successfully", {
    reviews,
    stats: {
      averageRating,
      reviewCount,
      ratingDistribution,
    },
  });
});
