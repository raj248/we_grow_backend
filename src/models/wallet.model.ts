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
};
