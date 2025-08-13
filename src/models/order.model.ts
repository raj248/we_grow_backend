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
          transactionId: orderId,
        },
      }),
    ]);
  },
};
