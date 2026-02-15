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

const userRouter = (router) => {
  router.get("/me", getMe);

  router.post("/sent-otp", validateRequest(sendOtpSchema), sentOtp);
  router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);
  router.post("/refresh", refresh);
  router.post("/logout", logout);
  router.get("/csrf", getCsrfToken);
  return router;
};

export default userRouter;
