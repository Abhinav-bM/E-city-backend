import Admin from "../models/admin-model.js";
import redis from "../config/redis-config.js";
import mobileOtpHelper from "../utils/mobileOtp-helper.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

const sendOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  const admin = await Admin.findOne({
    phoneNumber,
    isActive: true,
  });

  if (!admin) {
    return sendError(res, 403, "Unauthorized access");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Promise.all([
    redis.setex(`admin_data:${phoneNumber}`, 300, JSON.stringify(admin)),
    redis.setex(
      `admin_otp:${phoneNumber}`,
      300,
      JSON.stringify({
        otp,
        attempts: 0,
      }),
    ),
  ]);

  const result = await mobileOtpHelper(phoneNumber, otp);

  return sendResponse(res, 200, true, "OTP sent successfully", result.response);
});

export { sendOTP };
