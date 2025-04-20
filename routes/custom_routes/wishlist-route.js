import {
  addToWishlist,
  removeFromWishlist,
} from "../../controllers/wishlist-controller.js";

const wishlistRouter = (router) => {
  router.post("/add", addToWishlist);
  router.delete("/remove", removeFromWishlist);

  return router;
};

export default wishlistRouter;
