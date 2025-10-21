import { BoostPlan, Order, OrderStatus, PrismaClient } from "@prisma/client";
import { fetchYouTubeDetails } from "../utils/fetchVideoDetails.js";
const prisma = new PrismaClient();

type RawOrderWithBoostPlan = Order & {
  boostPlan: BoostPlan;
  boostPlan_id: string;
  boostPlan_title: string;
  boostPlan_description?: string;
  boostPlan_price: number;
  boostPlan_views: number;
  boostPlan_likes: number;
  boostPlan_subscribers: number;
  boostPlan_duration: number;
  boostPlan_reward: number;
  boostPlan_isActive: boolean;
  boostPlan_createdAt: Date;
  boostPlan_updatedAt: Date;
};

export const orderModel = {
  async createOrderWithTransaction(
    orderId: string,
    userId: string,
    planId: string,
    link: string,
    planPrice: number,
    viewCount?: number,
    likeCount?: number,
    subscriberCount?: number
  ) {
    return prisma.$transaction([
      prisma.order.create({
        data: {
          id: orderId,
          userId,
          planId,
          url: link,
          initialViewCount: Number.isFinite(viewCount) ? viewCount : 0,
          initialLikeCount: Number.isFinite(likeCount) ? likeCount : 0,
          initialSubscriberCount: Number.isFinite(subscriberCount)
            ? subscriberCount
            : 0,
          status: "ACTIVE",
        },
      }),
      prisma.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: planPrice },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: planPrice,
          type: "DEBIT",
          source: "Plan Purchase",
          status: "SUCCESS",
          transactionId: orderId, // RazorPayID
        },
      }),
    ]);
  },
  /**
   * Get a random order not watched by the user and not created by the user.
   *
   * For MYSQL ONLY
   */
  async getUniqueUnwatchedOrder(userId: string) {
    const [randomOrder] = await prisma.$queryRaw<RawOrderWithBoostPlan[]>`
      SELECT o.*, 
            b.id AS boostPlan_id, 
            b.title AS boostPlan_title,
            b.description AS boostPlan_description,
            b.price AS boostPlan_price,
            b.views AS boostPlan_views,
            b.likes AS boostPlan_likes,
            b.subscribers AS boostPlan_subscribers,
            b.duration AS boostPlan_duration,
            b.reward AS boostPlan_reward,
            b.isActive AS boostPlan_isActive,
            b.createdAt AS boostPlan_createdAt,
            b.updatedAt AS boostPlan_updatedAt
      FROM \`Order\` o
      JOIN \`BoostPlan\` b ON o.planId = b.id
      WHERE o.userId != ${userId}
        And b.views != 0
        AND o.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 
          FROM \`WatchHistory\` w
          WHERE w.orderId = o.id
            AND w.userId = ${userId}
        )
      ORDER BY RAND()
      LIMIT 1;
    `;

    if (!randomOrder) return null;

    // map boostPlan fields into nested object
    randomOrder.boostPlan = {
      id: randomOrder.boostPlan_id,
      title: randomOrder.boostPlan_title,
      description: randomOrder.boostPlan_description,
      price: randomOrder.boostPlan_price,
      views: randomOrder.boostPlan_views,
      likes: randomOrder.boostPlan_likes,
      subscribers: randomOrder.boostPlan_subscribers,
      duration: randomOrder.boostPlan_duration,
      reward: randomOrder.boostPlan_reward,
      isActive: randomOrder.boostPlan_isActive,
      createdAt: randomOrder.boostPlan_createdAt,
      updatedAt: randomOrder.boostPlan_updatedAt,
    };

    return randomOrder;
  },

  async getAll() {
    return await prisma.order.findMany({
      include: {
        boostPlan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  async getOrdersByUserId(userId: string) {
    return await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        boostPlan: true,
      },
      // orderBy: {
      //   createdAt: "desc",
      // },
    });
  },
  async getById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        boostPlan: true,
      },
    });
  },

  // delete order
  async deleteOrder(id: string) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });
    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const deletedOrder = await prisma.order.delete({
      where: { id },
    });
    return { success: true, data: deletedOrder };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    // reject if order doesn't exist
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return { success: true, data: updatedOrder };
  },

  async updateOrderProgressViewCount(orderId: string) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        progressViewCount: { increment: 1 },
      },
    });
    return { success: true, data: updatedOrder };
  },

  async updateOrderProgressLikeCount(orderId: string) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        progressLikeCount: { increment: 1 },
      },
    });
    return { success: true, data: updatedOrder };
  },

  async updateOrderProgressSubscriberCount(orderId: string) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        progressSubscriberCount: { increment: 1 },
      },
    });
    return { success: true, data: updatedOrder };
  },
};

export async function checkAndCompleteOrder(orderId: string) {
  // fetch order with related boost plan
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { boostPlan: true },
  });

  if (!order) throw new Error("Order not found");

  // required views
  const requiredViews = order.boostPlan.views;

  if (order.completedCount >= requiredViews && order.status !== "COMPLETED") {
    const { viewCount, likeCount, subscriberCount } = await fetchYouTubeDetails(
      order.url
    );
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        finalViewCount: Number(viewCount) ?? 0,
        finalLikeCount: Number(likeCount) ?? 0,
        finalSubscriberCount: Number(subscriberCount) ?? 0,
      },
    });
  }
}
