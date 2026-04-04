import express from "express";
import {
  requestReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
} from "../../controllers/return-controller.js";
import { requireAuth, requireAdminAuth } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const router = express.Router();

// ── Customer Routes ──────────────────────────────────────────────────────────
router.post("/request", requireAuth, requestReturn);
router.get("/my", requireAuth, getMyReturns);

// ── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/all", requireAdminAuth, getAllReturns);
router.put(
  "/:returnId/status",
  requireAdminAuth,
  validateObjectId("returnId"),
  updateReturnStatus,
);

export default router;
