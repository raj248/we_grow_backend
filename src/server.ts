import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import { logger } from "./utils/log.js";
import AnsiToHtml from "ansi-to-html";

const ansiToHtml = new AnsiToHtml();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true, // or your frontend IP/domain
    credentials: true,
  })
);

app.use(express.json());

// Serve public folder for debug
app.use(express.static(path.join(process.cwd(), "public")));

import { logResponseBody } from "./middleware/logResponseBody.js";
import { loadCacheMeta } from "./utils/cacheManager.js";
import mainRoute from "./routes/main.routes.js";
import userRoute from "./routes/user.routes.js";
import notificationsRoute from "./routes/notifications.routes.js";
import TopupRoute from "./routes/topup.routes.js";
import walletRoute from "./routes/wallet.routes.js";
import transactionRoute from "./routes/transaction.routes.js";
import boostPlanRoute from "./routes/boost-plan.routes.js";
import orderRoute from "./routes/order.routes.js";
import { format } from "date-fns";

app.use(logResponseBody);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    timestamp: format(new Date().toISOString(), "yyyy-MM-dd HH:mm:ss"),
    uptime: process.uptime(), // in seconds
  });
});

app.get("/status", (req, res) =>
  res.json({
    time: new Date().toLocaleString(),
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
  })
);
app.get("/logs", (req, res) => {
  const coloredHtmlLines = logger.logs.map((line) => ansiToHtml.toHtml(line));
  res.json(coloredHtmlLines);
});

app.use("/notifications", notificationsRoute);
app.use("/api/main", mainRoute);
app.use("/api/user", userRoute);
app.use("/api/topup-options", TopupRoute);
app.use("/api/wallet", walletRoute);
app.use("/api/transactions", transactionRoute);
app.use("/api/boost-plans", boostPlanRoute);
app.use("/api/order", orderRoute);
// Serve uploaded files statically if needed:
app.use("/uploads", express.static("uploads"));

app.post("/api/run-worker-now", async (req, res) => {
  try {
    logger.log("🔄 Manual trigger: orderStatsWorker() started...");
    await orderStatsWorker(true);
    logger.log("✅ Manual trigger: orderStatsWorker() completed successfully.");
    res.json({ success: true, message: "Worker executed immediately." });
  } catch (err) {
    logger.error(`❌ Manual worker trigger failed: ${err}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// After API routes, before 404 JSON:
app.use((req, res, next) => {
  if (req.url.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.url.startsWith("/assets")) {
    return next(); // let static middleware handle assets
  }

  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

await loadCacheMeta(); // before app.listen()
// app.listen({ port: PORT, host: '0.0.0.0' }, () => {
//   logger.log(`Server running at http://0.0.0.0:${PORT}`);
// });

import http from "http";
import { orderStatsWorker } from "./utils/worker.js";

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});

// orderStatsWorker();
setInterval(orderStatsWorker, 30 * 60 * 1000);

// import {
//   extractChannelIdOrHandle,
//   fetchChannelStats,
//   fetchYouTubeDetails,
// } from "utils/fetchVideoDetails.js";

// fetchChannelStats([
//   extractChannelIdOrHandle("https://youtube.com/@code_insane?feature=shared"),
// ]).then(console.log);

// // fetchYouTubeDetails("https://www.youtube.com/@Code_Insane").then(console.log);
// //

// console.log(extractChannelIdOrHandle("https://www.youtube.com/@Code_Insane"));
