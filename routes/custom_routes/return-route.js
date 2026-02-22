import express from "express";
import {
  requestReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
} from "../../controllers/return-controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = express.Router();

// ── Customer Routes ──────────────────────────────────────────────────────────
router.post("/request", requireAuth, requestReturn);
router.get("/my", requireAuth, getMyReturns);

// ── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/all", requireAuth, getAllReturns);
router.put("/:returnId/status", requireAuth, updateReturnStatus);

export default router;
