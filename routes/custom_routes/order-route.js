import { Router } from "express";
import {
  placeOrder,
  placeDirectOrder,
  getMyOrders,
  getAllOrders,
  getOrderDetail,
  updateStatus,
  downloadInvoice,
} from "../../controllers/order-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const orderRouter = () => {
  const router = Router();

  // ─── Customer routes (require user auth) ─────────────────────────────────────
  router.post("/", requireAuth, placeOrder); // POST   /api/order
  router.post("/direct", requireAuth, placeDirectOrder); // POST   /api/order/direct
  router.get("/my", requireAuth, getMyOrders); // GET    /api/order/my
  router.get("/:id", requireAuth, getOrderDetail); // GET    /api/order/:id
  router.get("/:id/invoice", requireAuth, downloadInvoice); // GET    /api/order/:id/invoice

  // ─── Admin routes ─────────────────────────────────────────────────────────────
  // Step 14: requireAuth added — previously had NO auth middleware.
  // Admin-role enforcement is handled inside getAllOrders / updateStatus controllers.
  router.get("/", requireAuth, getAllOrders); // GET    /api/order
  router.patch("/:id/status", requireAuth, updateStatus); // PATCH  /api/order/:id/status

  return router;
};

export default orderRouter;
