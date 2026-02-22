import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

/**
 * createRazorpayOrder — creates an order on Razorpay's end
 * @param {number} amount   - amount in INR (will be converted to paise)
 * @param {string} receipt  - our internal order ID as receipt ref
 */
const createRazorpayOrder = async (amount, receipt) => {
  const options = {
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency: "INR",
    receipt,
  };
  return razorpay.orders.create(options);
};

/**
 * verifyPaymentSignature — validates Razorpay's callback signature
 * Ensures the payment wasn't tampered with.
 */
const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};

export { createRazorpayOrder, verifyPaymentSignature };
