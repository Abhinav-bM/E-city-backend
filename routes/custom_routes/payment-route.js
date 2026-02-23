import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  paymentWebhook,
} from "../../controllers/payment-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const paymentRouter = () => {
  const router = Router();

  router.post("/create-order", requireAuth, createPaymentOrder);
  router.post("/verify", requireAuth, verifyPayment);
  router.post("/failure", requireAuth, handlePaymentFailure);

  // Webhook does not use requireAuth since it's called by Razorpay servers
  router.post("/webhook", paymentWebhook);

  return router;
};

export default paymentRouter;
