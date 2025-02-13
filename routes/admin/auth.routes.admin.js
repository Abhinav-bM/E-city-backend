const express = require("express");
const router = express.Router();

const adminAuthController = require("../../controllers/admin/auth.controller.admin");

router.post("/send-otp", adminAuthController.sendOTP)

module.exports = router;
