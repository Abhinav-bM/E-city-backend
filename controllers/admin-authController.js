
import Admin from "../models/admin-model";
import redis from "../config/redis-config";
import mobileOtpHelper from "../utils/mobileOtp-helper";

const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const admin = await Admin.findOne({
      phoneNumber,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
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
        })
      ),
    ]);

    const result = await mobileOtpHelper(phoneNumber, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: result.response,
    });
  } catch (error) {
    console.error("OTP sending failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

module.exports = { sendOTP };
