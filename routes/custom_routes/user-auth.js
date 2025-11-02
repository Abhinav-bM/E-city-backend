import {
  logout,
  sentOtp,
  verifyOtp,
  refresh,
  getMe,
} from "../../controllers/user-authController.js";

const userRouter = (router) => {
  router.get("/me", getMe);

  router.post("/sent-otp", sentOtp);
  router.post("/verify-otp", verifyOtp);
  router.post("/refresh", refresh);
  router.post("/logout", logout);
  return router;
};

export default userRouter;
