import USER from "../models/user-model.js";
import { generateOTP, sendOtp, storeOtp } from "../utils/otp-helper.js";

export const userLogin = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await USER.findOne(phone);

    if (user) {
      const otp = generateOTP();
      storeOtp();
      await sendOtp(phone, otp);
    }
  } catch (error) {
    console.error(error);
  }
};
