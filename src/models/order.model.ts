import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const orderModel = {

  async createOrderWithTransaction(
    orderId: string,
    userId: string,
    planId: string,
    link: string,
    planPrice: number
  ) {
    return prisma.$transaction([
      prisma.order.create({
        data: {
          id: orderId,
          userId,
          planId,
          url: link,
          status: "PENDING",
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
   * Get a random order not watched by the user and not created by the user
   */
  async getUniqueUnwatchedOrder(userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        userId: { not: userId }, // not placed by same user
        watchHistory: {
          none: {
            userId: userId, // not yet watched by this user
          },
        },
      },
      orderBy: {
        createdAt: "asc", // newest first (change if you want random)
      },
      // include: {
      //   boostPlan: true,
      //   user: {
      //     select: {
      //       userId: true,
      //     },
      //   },
      // },
    });
    return order;
  },

  async getAll() {
    return await prisma.order.findMany();
  },
  async getOrdersByUserId(userId: string) {
    return await prisma.order.findMany({
      where: {
        userId,
      },
    });
  },
};
