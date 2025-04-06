import { addToCart } from "../../controllers/cart-controller.js";

const cartRouter = (router) => {
  router.post("/add", addToCart);
  return router;
};

export default cartRouter;
