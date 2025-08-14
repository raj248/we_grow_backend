import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const WalletModel = {
  async getWalletByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) return null;
    return wallet;
  },

  async createWallet(userId: string, initialBalance = 50) {
    return prisma.wallet.create({
      data: {
        userId,
        balance: initialBalance,
      },
    });
  },

  async updateBalance(userId: string, newBalance: number) {
    return prisma.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });
  },

  async incrementBalance(userId: string, amount: number) {
    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
      },
    })
  },

  async decrementBalance(userId: string, amount: number) {
    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
      },
    });
  },

  async rewardWithTransaction(userId: string, orderId: string, amount: number, tId: string) {
    return prisma.$transaction([
      prisma.wallet.update({
        where: { userId },
        data: {
          balance: { increment: amount },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          type: "CREDIT",
          source: "Watch Reward",
          status: "SUCCESS",
          transactionId: tId,
        },
      }),
      prisma.watchHistory.create({
        data: { userId, orderId },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          completedCount: { increment: 1 },
        },
      }),
    ]);
  },
};
