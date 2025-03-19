import USER from "../models/user-model.js";
import { generateOTP } from "../utils/otp-helper.js";
export const userLogin = (req, res) => {
  try {
    const { phone } = req.body;
    const user = new USER.findOne(phone);

    if (user) {
      const otp = generateOTP();
    }
  } catch (error) {
    console.error(error);
  }
};
