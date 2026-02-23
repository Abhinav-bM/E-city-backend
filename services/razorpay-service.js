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
 * verifyPaymentSignature — validates Razorpay's callback signature.
 * Ensures the payment wasn't tampered with on the client side.
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

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(razorpay_signature, "utf8"),
    );
  } catch (err) {
    return false;
  }
};

/**
 * verifyWebhookSignature — validates Razorpay's webhook signature.
 * Uses a DEDICATED webhook secret (not the API key secret) for
 * least-privilege separation. RAZORPAY_WEBHOOK_SECRET must be set as its
 * own env variable matching the secret configured in the Razorpay dashboard.
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: RAZORPAY_WEBHOOK_SECRET is not configured. " +
        "Set it in .env and in the Razorpay dashboard webhook settings.",
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Prevent timing attacks with constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch (err) {
    // Fails safely if lengths differ (prevents length oracle attacks)
    return false;
  }
};

// Export the razorpay SDK instance so payment-controller can use
// razorpay.payments.fetch() for server-to-server cross-verification
export {
  razorpay,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
