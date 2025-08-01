// src/utils/notificationUtil.ts
import admin from "firebase-admin";
import { logger } from "./log";

if (!admin.apps.length) {
  logger.log("Initializing Firebase Admin SDK...");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function sendNotification(message: admin.messaging.Message) {
  try {
    const response = await admin.messaging().send(message);
    logger.log(`✅ Notification sent: ${response}`);
    return { success: true, response };
  } catch (error: any) {
    logger.error(`❌ Notification error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
