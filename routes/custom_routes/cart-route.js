import { addToCart } from "../../controllers/cart-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const cartRouter = (router) => {
  router.post("/add", requireAuth, addToCart);
  return router;
};

export default cartRouter;
