import { Router } from "express";
import {
  login,
  refresh,
  logout,
  getMe,
} from "../../controllers/admin-authController.js";
import { getCsrfToken } from "../../controllers/user-authController.js";
import { requireAuth } from "../../middlewares/auth.js";

const adminAuthRouter = () => {
  const router = Router();
  router.post("/login", login);
  router.post("/refresh", refresh);
  router.post("/logout", logout);
  router.get("/me", requireAuth, getMe);
  router.get("/csrf", getCsrfToken);
  return router;
};

export default adminAuthRouter;
