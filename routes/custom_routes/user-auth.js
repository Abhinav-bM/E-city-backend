import { logout, sentOtp, verifyOtp, refresh } from "../../controllers/user-authController.js";

const userRouter = (router) => {
  router.post("/sent-otp", sentOtp);
  router.post("/verify-otp", verifyOtp);
  router.post("/refresh", refresh);
  router.post("/logout", logout)
  return router;
};

export default userRouter;