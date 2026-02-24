import { Router } from "express";
import {
  logout,
  sentOtp,
  verifyOtp,
  refresh,
  getMe,
  getCsrfToken,
} from "../../controllers/user-authController.js";

import { validateRequest } from "../../middlewares/validation-middleware.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
} from "../../utils/validation-schemas.js";

import { requireAuth } from "../../middlewares/auth.js";
import {
  otpLimiter,
  authLimiter,
} from "../../middlewares/rate-limit-middleware.js";

const userRouter = () => {
  const router = Router();
  router.get("/me", requireAuth, getMe);

  router.post("/sent-otp", otpLimiter, validateRequest(sendOtpSchema), sentOtp);
  router.post(
    "/verify-otp",
    authLimiter,
    validateRequest(verifyOtpSchema),
    verifyOtp,
  );
  router.post("/refresh", refresh);
  router.post("/logout", logout);
  router.get("/csrf", getCsrfToken);
  return router;
};

export default userRouter;
