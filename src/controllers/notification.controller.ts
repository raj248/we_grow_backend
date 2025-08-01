// src/controllers/notificationController.ts
import { Request, Response } from "express";
import admin from "firebase-admin";
import { sendNotification } from "~/utils/notificationUtil";

export async function broadcastNotification(req: Request, res: Response) {
  const { title, body, data } = req.body as {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  };

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      error: "title and body are required in the request body",
    });
  }

  const message: admin.messaging.Message = {
    topic: "all-devices",
    notification: { title, body },
    data: data || {},
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  const result = await sendNotification(message);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
}

export async function broadcastTestNotification(_req: Request, res: Response) {
  const message: admin.messaging.Message = {
    topic: "all-devices",
    notification: {
      title: "🚀 Test Notification",
      body: "This is a test broadcast to all devices.",
    },
    data: { quizId: "test123", test: "true" },
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  const result = await sendNotification(message);

  if (result.success) {
    res.json({
      success: true,
      message: "Test broadcast notification sent to all-devices",
      response: result.response,
    });
  } else {
    res.status(500).json(result);
  }
}
