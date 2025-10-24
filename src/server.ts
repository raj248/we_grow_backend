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

import { UserModel } from "./models/user.model.js";

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

app.post("/google-play/notifications", async (req, res) => {
  try {
    const notification = req.body;

    // Google sends a 'subscriptionNotification' or 'oneTimeProductNotification'

    const encodedData = notification.message?.data;
    if (!encodedData) {
      console.log("No data field in RTDN");
      return res.sendStatus(400);
    }

    // Decode base64
    const decoded = Buffer.from(encodedData, "base64").toString("utf-8");
    const data = JSON.parse(decoded);

    notification.message.data = data;

    console.log(JSON.stringify(data.voidedPurchaseNotification ?? {}));

    console.log(JSON.stringify(data.oneTimeProductNotification ?? {}));

    console.log("Received RTDN:", notification, data);

    if (notification?.message?.data.voidedPurchaseNotification) {
      const productNotification =
        notification?.message?.data.voidedPurchaseNotification;

      const orderId = productNotification.orderId;
      if (!orderId) {
        res.status(200).send("ok");
        console.log("No orderId in RTDN");
        return;
      }
      const refund = await UserModel.refundUser(orderId);
      console.log("REFUND: ", refund);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
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

// curl -X POST https://ytapp.zenextech.in/google-play/notifications \
//   -H "Content-Type: application/json" \
//   -d '{
//     "message": {
//       "data": "ewp2ZXJzaW9uOiAnMS4wJywKcGFja2FnZU5hbWU6ICdjb20ueW91cmVhY2hib29zdGVyLnRlY2guemVuZXgnLApldmVudFRpbWVNaWxsaXM6ICcxNzYxMzA5NzA2MDkwJywKdm9pZGVkUHVyY2hhc2VOb3RpZmljYXRpb246IHsKcHVyY2hhc2VUb2tlbjogJ25lZ2hhaGtmcGVocGZmZnBlb25vYmdncC5BTy1KMU96UlpiN01YYlFyaFNESjJjZ1drNmhOU3dxUVlleHR2TFpQeUNiTmZxMWRKNXBmMnJnZlpNTHM5UzZ3Z2dEa3MxTWhjeDV3OWVteENpZndHaTl0ZWhxU0IxUU82Mi13dWpraVVkRGdzVnNQUUhqRjZBMCcsCm9yZGVySWQ6ICdHUEEuMzM0My01OTQzLTk2NTEtMTQyMTEnLApwcm9kdWN0VHlwZTogMiwKcmVmdW5kVHlwZTogMQp9Cn0K",
//       "messageId": "16820381691724025",
//       "publishTime": "2025-10-24T12:41:46.294Z"
//     },
//     "subscription": "projects/googple-play-console-developer/subscriptions/you-reach-booster-sub"
//   }'
