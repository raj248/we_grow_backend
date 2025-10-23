import { PrismaClient, OrderStatus } from "@prisma/client";
import {
  extractVideoId,
  extractChannelIdOrHandle,
  fetchVideoStats,
  fetchChannelStats,
} from "../utils/fetchVideoDetails.js";
import { setLastUpdated } from "./cacheManager.js";
import { cacheKeys } from "./cacheKeys.js";

const prisma = new PrismaClient();
let isProcessing = false;

export async function orderStatsWorker() {
  console.log("Starting order stats worker...");
  if (isProcessing) return;
  isProcessing = true;

  try {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

    // Fetch orders that qualify for stats check
    const orders = await prisma.order.findMany({
      where: {
        status: "ACTIVE",
        updatedAt: { lte: twentyHoursAgo },
        createdAt: { lte: twentyHoursAgo },
      },
      take: 50, // batch size
      include: { boostPlan: true },
    });

    if (!orders.length) {
      console.log("No orders need stats check right now.");
      return;
    }

    console.log(`Processing ${orders.length} orders for stats update...`);

    // Separate orders by type
    const videoOrders: typeof orders = [];
    const channelOrders: typeof orders = [];

    for (const order of orders) {
      const videoId = extractVideoId(order.url);
      const channelIdOrHandle = extractChannelIdOrHandle(order.url);

      if (videoId) videoOrders.push(order);
      else if (channelIdOrHandle) channelOrders.push(order);
      else console.warn(`Unknown URL type for order ${order.id}: ${order.url}`);
    }

    // ------------------- Batch fetch video stats -------------------
    if (videoOrders.length) {
      const videoIds = videoOrders.map((o) => extractVideoId(o.url)!);
      const videoStats = await fetchVideoStats(videoIds);

      for (const order of videoOrders) {
        const stats = videoStats[extractVideoId(order.url)!];
        if (!stats) continue;

        const updatedData: any = {
          progressViewCount: stats.viewCount ?? order.progressViewCount,
          progressLikeCount: stats.likeCount ?? order.progressLikeCount,
          updatedAt: new Date(),
        };

        // mark completed if required views met
        if (
          order.boostPlan &&
          stats.viewCount - order.initialViewCount >= order.boostPlan.views &&
          stats.likeCount - order.initialLikeCount >= order.boostPlan.likes
        ) {
          updatedData.status = OrderStatus.COMPLETED;
          updatedData.finalViewCount = stats.viewCount;
          updatedData.finalLikeCount = stats.likeCount;
          updatedData.finalSubscriberCount = order.progressSubscriberCount ?? 0;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: updatedData,
        });
        setLastUpdated(cacheKeys.orderInfo(order.userId));

        console.log(`✅ Updated video order ${order.id}`);
      }
    }

    // ------------------- Batch fetch channel subscriber stats -------------------
    if (channelOrders.length) {
      const channelIds = channelOrders.map(
        (o) => extractChannelIdOrHandle(o.url)!
      );
      const channelStats = await fetchChannelStats(channelIds);

      for (const order of channelOrders) {
        const subs = channelStats[extractChannelIdOrHandle(order.url)!] ?? 0;

        const updatedData: any = {
          progressSubscriberCount: subs ?? order.progressSubscriberCount,
          updatedAt: new Date(),
        };

        // mark completed if required subscribers met
        if (
          order.boostPlan &&
          subs - order.initialSubscriberCount >= order.boostPlan.subscribers
        ) {
          updatedData.status = OrderStatus.COMPLETED;
          updatedData.finalSubscriberCount = subs;
          updatedData.finalViewCount = order.progressViewCount ?? 0;
          updatedData.finalLikeCount = order.progressLikeCount ?? 0;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: updatedData,
        });
        setLastUpdated(cacheKeys.orderInfo(order.userId));
        console.log(`✅ Updated channel order ${order.id}`);
      }
    }
    setLastUpdated(cacheKeys.orderList());
  } catch (err) {
    console.error("Order stats worker failed:", err);
  } finally {
    isProcessing = false;
  }
}

export async function refreshOrderWorker(orderId) {
  console.log(`🔄 Refreshing single order ${orderId}...`);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { boostPlan: true },
    });

    if (!order) {
      console.warn(`⚠️ Order ${orderId} not found.`);
      return { success: false, message: "Order not found" };
    }

    const videoId = extractVideoId(order.url);
    const channelIdOrHandle = extractChannelIdOrHandle(order.url);

    if (!videoId && !channelIdOrHandle) {
      console.warn(`⚠️ Unknown URL type for order ${order.id}: ${order.url}`);
      return { success: false, message: "Unknown URL type" };
    }

    let updatedData: any = {
      updatedAt: new Date(),
    };

    // ------------------- Video order -------------------
    if (videoId) {
      const videoStats = await fetchVideoStats([videoId]);
      const stats = videoStats?.[videoId];

      if (!stats) {
        console.warn(`⚠️ No stats found for video ${videoId}`);
        return { success: false, message: "No stats found" };
      }

      updatedData.progressViewCount =
        stats.viewCount ?? order.progressViewCount;
      updatedData.progressLikeCount =
        stats.likeCount ?? order.progressLikeCount;

      // mark completed if required views met
      if (
        order.boostPlan &&
        stats.viewCount - order.initialViewCount >= order.boostPlan.views &&
        stats.likeCount - order.initialLikeCount >= order.boostPlan.likes
      ) {
        updatedData.status = OrderStatus.COMPLETED;
        updatedData.finalViewCount = stats.viewCount;
        updatedData.finalLikeCount = stats.likeCount;
        updatedData.finalSubscriberCount = order.progressSubscriberCount ?? 0;
      }
    }

    // ------------------- Channel order -------------------
    else if (channelIdOrHandle) {
      const channelStats = await fetchChannelStats([channelIdOrHandle]);
      const subs = channelStats?.[channelIdOrHandle] ?? 0;

      updatedData.progressSubscriberCount =
        subs ?? order.progressSubscriberCount;

      if (
        order.boostPlan &&
        subs - order.initialSubscriberCount >= order.boostPlan.subscribers
      ) {
        updatedData.status = OrderStatus.COMPLETED;
        updatedData.finalSubscriberCount = subs;
        updatedData.finalViewCount = order.progressViewCount ?? 0;
        updatedData.finalLikeCount = order.progressLikeCount ?? 0;
      }
    }

    // ------------------- Apply update -------------------
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updatedData,
    });

    setLastUpdated(cacheKeys.orderInfo(order.userId));
    setLastUpdated(cacheKeys.orderList());

    console.log(`✅ Successfully refreshed order ${order.id}`);
    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error(`❌ Failed to refresh order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}
