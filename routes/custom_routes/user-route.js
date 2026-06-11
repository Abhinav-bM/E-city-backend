import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  removeAddress,
  getAllUsers,
  updatePushToken,
} from "../../controllers/user-controller.js";
import { requireAuth, requireAdminAuth } from "../../middlewares/auth.js";

const profileRouter = () => {
  const router = Router();

  // Admin route
  router.get("/all", requireAdminAuth, getAllUsers);

  // Customer routes (Profile)
  router.get("/", requireAuth, getUserProfile);
  router.put("/", requireAuth, updateUserProfile);
  router.post("/push-token", requireAuth, updatePushToken);

  // Customer routes (Address Book)
  router.post("/address", requireAuth, addAddress);
  router.put("/address/:addressId", requireAuth, updateAddress);
  router.delete("/address/:addressId", requireAuth, removeAddress);

  return router;
};

export default profileRouter;
