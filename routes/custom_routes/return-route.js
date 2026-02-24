import express from "express";
import {
  requestReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
} from "../../controllers/return-controller.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { validateObjectId } from "../../middlewares/validate-id-middleware.js";

const router = express.Router();

// ── Customer Routes ──────────────────────────────────────────────────────────
router.post("/request", requireAuth, requestReturn);
router.get("/my", requireAuth, getMyReturns);

// ── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/all", requireAuth, requireAdmin, getAllReturns);
router.put(
  "/:returnId/status",
  requireAuth,
  requireAdmin,
  validateObjectId("returnId"),
  updateReturnStatus,
);

export default router;
