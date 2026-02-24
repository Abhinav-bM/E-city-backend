import { Router } from "express";
import {
  login,
  refresh,
  logout,
  getMe,
  getCsrfAdminToken,
} from "../../controllers/admin-authController.js";
import { requireAuth } from "../../middlewares/auth.js";
import { authLimiter } from "../../middlewares/rate-limit-middleware.js";

const adminAuthRouter = () => {
  const router = Router();
  router.post("/login", authLimiter, login);
  router.post("/refresh", refresh);
  router.post("/logout", logout);
  router.get("/me", requireAuth, getMe);
  router.get("/csrf", getCsrfAdminToken);
  return router;
};

export default adminAuthRouter;
