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
import { requireAuth, requireAdminAuth } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";
import { validateRequest } from "../../middlewares/validation-middleware.js";
import {
  placeOrderSchema,
  placeDirectOrderSchema,
} from "../../utils/validation-schemas.js";

const orderRouter = () => {
  const router = Router();

  // ─── Customer routes (require user auth) ─────────────────────────────────────
  router.post("/", requireAuth, validateRequest(placeOrderSchema), placeOrder);
  router.post(
    "/direct",
    requireAuth,
    validateRequest(placeDirectOrderSchema),
    placeDirectOrder,
  );
  router.get("/my", requireAuth, getMyOrders);
  router.get("/:id", requireAuth, validateObjectId(), getOrderDetail);
  router.get("/:id/invoice", requireAuth, validateObjectId(), downloadInvoice);

  // ─── Admin routes ─────────────────────────────────────────────────────────────
  router.get("/", requireAdminAuth, getAllOrders);
  router.get("/admin/:id", requireAdminAuth, validateObjectId(), getOrderDetail);
  router.get(
    "/admin/:id/invoice",
    requireAdminAuth,
    validateObjectId(),
    downloadInvoice,
  );
  router.patch(
    "/:id/status",
    requireAdminAuth,
    validateObjectId(),
    updateStatus,
  );

  return router;
};

export default orderRouter;
