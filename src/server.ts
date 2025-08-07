import 'dotenv/config';

import express from "express";
import cors from "cors";
import path from "path";
import { logger } from "./utils/log.js";
import AnsiToHtml from 'ansi-to-html';

const ansiToHtml = new AnsiToHtml();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true, // or your frontend IP/domain
  credentials: true,
}));

app.use(express.json());

// Serve public folder for debug
app.use(express.static(path.join(process.cwd(), 'public')));

import { logResponseBody } from "./middleware/logResponseBody.js";
import { loadCacheMeta } from './utils/cacheManager.js';
import mainRoute from "./routes/main.routes.js";
import userRoute from "./routes/user.routes.js";
import notificationsRoute from "./routes/notifications.routes.js";
import purchaseOptionRoute from "./routes/purchase-option.routes.js";
import walletRoute from "./routes/wallet.routes.js";
import transactionRoute from "./routes/transaction.routes.js"
import { format } from 'date-fns';

app.use(logResponseBody);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    timestamp: format(new Date().toISOString(), 'yyyy-MM-dd HH:mm:ss'),
    uptime: process.uptime() // in seconds
  });
});

app.get("/status", (req, res) => res.json({
  time: new Date().toLocaleString(),
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000
}));
app.get("/logs", (req, res) => {
  const coloredHtmlLines = logger.logs.map(line => ansiToHtml.toHtml(line));
  res.json(coloredHtmlLines);
});

app.use("/notifications", notificationsRoute);
app.use("/api/main", mainRoute);
app.use("/api/user", userRoute);
app.use("/api/purchase-options", purchaseOptionRoute)
app.use('/api/wallet', walletRoute);
app.use('/api/transactions', transactionRoute);

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

await loadCacheMeta(); // before app.listen()
// app.listen({ port: PORT, host: '0.0.0.0' }, () => {
//   logger.log(`Server running at http://0.0.0.0:${PORT}`);
// });

import http from "http"

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});