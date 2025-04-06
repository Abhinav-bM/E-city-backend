import springedge from "springedge";
import redis from "../config/redis-config.js";

export function generateOTP(length = 6) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export const sendOtp = (mobileNumber, OTP) => {
  return new Promise((resolve, reject) => {
    const params = {
      apikey: process.env.SPRINGEDGE_API_KEY,
      sender: process.env.SPRINGEDGE_SENDER_ID,
      to: [mobileNumber],
      message: `Hello ${OTP}, This is a test message from spring edge`,
      format: "json",
    };

    springedge.messages.send(params, 5000, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true, response });
      }
    });
  });
};

export const storeOtp = (user_id, otp) => {
  redis.set(`otp${user_id}`, otp, "EX", 300);
};

export const verifyOtp = async (user_id, otp) => {
  const storedOtp = await redis.get(`otp:${user_id}`);
  return storedOtp === otp;
};
