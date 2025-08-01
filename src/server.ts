import 'dotenv/config';

import express from "express";
import cors from "cors";
import path from "path";
import { logger } from "~/utils/log";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve public folder for debug
app.use(express.static(path.join(process.cwd(), 'public')));

import { logResponseBody } from "~/middleware/logResponseBody";
import { loadCacheMeta } from './utils/cacheManager';
import mainRoute from "~/routes/main.routes";
import userRoute from "~/routes/user.routes";
import notificationsRoute from "~/routes/notifications.routes";

app.use(logResponseBody);

app.get("/status", (req, res) => res.json({
  time: new Date().toLocaleString(),
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000
}));
app.get("/logs", (req, res) => res.json(logger.logs));
app.use("/notifications", notificationsRoute);
app.use("/api/main", mainRoute)
app.use("/api/user", userRoute)

// Serve uploaded files statically if needed:
app.use('/uploads', express.static('uploads'));

// Handle unknown routes
app.use((req, res) => {
  logger.warn(`Unknown route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// await loadCacheMeta(); // before app.listen()
app.listen({ port: PORT, host: '0.0.0.0' }, () => {
  logger.log(`Server running at http://0.0.0.0:${PORT}`);
});
