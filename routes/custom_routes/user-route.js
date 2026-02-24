import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  removeAddress,
  getAllUsers,
} from "../../controllers/user-controller.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";

const profileRouter = () => {
  const router = Router();

  // Admin route
  router.get("/all", requireAuth, requireAdmin, getAllUsers);

  // Customer routes (Profile)
  router.get("/", requireAuth, getUserProfile);
  router.put("/", requireAuth, updateUserProfile);

  // Customer routes (Address Book)
  router.post("/address", requireAuth, addAddress);
  router.put("/address/:addressId", requireAuth, updateAddress);
  router.delete("/address/:addressId", requireAuth, removeAddress);

  return router;
};

export default profileRouter;
