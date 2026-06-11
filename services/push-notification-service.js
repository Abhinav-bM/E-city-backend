import { Expo } from "expo-server-sdk";
import logger from "../utils/logger.js"; // Standard logger if available, else console

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Sends a push notification to a specific device using its Expo Push Token.
 * 
 * @param {string} pushToken - The recipient's Expo push token (e.g., ExponentPushToken[xxx])
 * @param {string} title - The notification title
 * @param {string} body - The notification message body
 * @param {Object} [data] - Optional metadata/payload to send with the notification (useful for deep-linking)
 * @returns {Promise<Object>} The send status/ticket
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // 1. Validate push token format
  if (!Expo.isExpoPushToken(pushToken)) {
    const errorMsg = `Push token ${pushToken} is not a valid Expo push token`;
    if (logger && logger.error) {
      logger.error(errorMsg);
    } else {
      console.error(errorMsg);
    }
    return { success: false, error: "Invalid Expo push token" };
  }

  // 2. Build the message payload
  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    // 3. Send the notification chunk
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];
    
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    if (logger && logger.info) {
      logger.info(`Push notification sent successfully to ${pushToken}. Tickets:`, tickets);
    } else {
      console.log(`Push notification sent successfully to ${pushToken}. Tickets:`, tickets);
    }

    return { success: true, tickets };
  } catch (error) {
    if (logger && logger.error) {
      logger.error("Error sending push notification:", error);
    } else {
      console.error("Error sending push notification:", error);
    }
    return { success: false, error: error.message };
  }
};
