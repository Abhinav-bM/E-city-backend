import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
} from "../../controllers/payment-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const paymentRouter = () => {
  const router = Router();

  router.post("/create-order", requireAuth, createPaymentOrder);
  router.post("/verify", requireAuth, verifyPayment);
  router.post("/failure", requireAuth, handlePaymentFailure);

  return router;
};

export default paymentRouter;
