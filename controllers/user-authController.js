import USER from "../models/user.ts";
import ApiResponse from "../utils/api-response.js";
import { generateOTP, sendOtp, storeOtp } from "../utils/otp-helper.js";

// create a new user if not exist
const createUser = async (phone) => {
  try {
  } catch (error) {}
};

// login with otp
const userLogin = async (req, res) => {
  console.log("called me")
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json(
        new ApiResponse({
          message: "Phone number is required",
          statusCode: 400,
        })
      );
    }

    const user = await USER.findOne(phone);


    if (user) {
      const otp = generateOTP();
      storeOtp(user._id, otp);
      await sendOtp(phone, otp);
      res.status(200).json(
        new ApiResponse({
          message: "Otp send successfully",
          statusCode: 200,
        })
      );
    } else {
      createUser(phone);
    }
  } catch (error) {
    console.error(error);
  }
};

export { userLogin };