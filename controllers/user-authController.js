import USER from "../models/user.js";
import { generateOTP, sendOtp, storeOtp } from "../utils/otp-helper.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
} from "../utils/token.js";

const otpStore = new Map();

// login with otp
export const sentOtp = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Debugging line
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number required" });

    let user = await USER.findOne({ phone });

    if (!user) {
      user = new USER({ phone });
      await user.save();
    }

    if (user) {
      const otp = "123456"; // generateOTP();
      // storeOtp(user._id, otp);
      otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry
      // await sendOtp(phone, otp);
      res.json({ message: "OTP sent" });
    }
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: "Phone and OTP required" });

    const record = otpStore.get(phone);
    if (!record)
      return res.status(400).json({ message: "OTP expired or not found" });
    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (record.expires < Date.now()) {
      otpStore.delete(phone);
      return res.status(400).json({ message: "OTP expired" });
    }

    // if otp is valid generate jwt
    const user = await USER.findOne({ phone });
    const accessToken = createAccessToken({ userId: user._id });
    const refreshToken = createRefreshToken({ userId: user._id });

    otpStore.delete(phone); // remove used OTP

    setRefreshTokenCookie(res, refreshToken);

    // After verifying OTP successfully
    res.status(200).json({
      message: "OTP verified successfully",
      accessToken,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Missing refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    const user = await USER.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newPayload = { userId: user._id };
    const newAccessToken = createAccessToken(newPayload);
    const newRefreshToken = createRefreshToken(newPayload);

    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    res.clearCookie("refreshToken", { path: "/auth/refresh" });
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
