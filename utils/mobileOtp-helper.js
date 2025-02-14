import springedge from "springedge";

const mobileOtpHelper = (mobileNumber, OTP) => {
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

module.exports = mobileOtpHelper;
