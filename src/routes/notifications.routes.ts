// src/routes/notification.routes.ts
import express from "express";
import {
  broadcastNotification,
  broadcastTestNotification,
} from "../controllers/notification.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/broadcast", verifyAdmin, broadcastNotification);
// router.get("/broadcast/test", broadcastTestNotification);

export default router;
