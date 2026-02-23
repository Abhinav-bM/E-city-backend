import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  removeAddress,
  getAllUsers,
} from "../../controllers/user-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const profileRouter = () => {
  const router = Router();

  // Admin route
  router.get("/all", requireAuth, getAllUsers); // Add admin check middleware if available

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
