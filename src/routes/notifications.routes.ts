// src/routes/notification.routes.ts
import express from "express";
import {
  broadcastNotification,
  broadcastTestNotification,
} from "~/controllers/notification.controller";

const router = express.Router();

router.post("/broadcast", broadcastNotification);
router.get("/broadcast/test", broadcastTestNotification);

export default router;
