import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const watchHistoryModel = {
  async getAll() {
    try {
      const items = await prisma.watchHistory.findMany({
        include: {
          user: true,
          order: true,
        },
        orderBy: {
          watchedAt: "desc",
        },
      });
      return { success: true, data: items };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to fetch watch history." };
    }
  },

  async add(userId: string, orderId: string) {
    try {
      const item = await prisma.watchHistory.create({
        data: { userId, orderId },
      });
      return { success: true, data: item };
    } catch (error: any) {
      if (error.code === "P2002") {
        // Prisma unique constraint violation
        return { success: false, error: "Already in watch history." };
      }
      console.error(error);
      return { success: false, error: "Failed to add to watch history." };
    }
  },

  async getByUser(userId: string) {
    try {
      const items = await prisma.watchHistory.findMany({
        where: { userId },
        include: { order: true },
        orderBy: { watchedAt: "desc" },
      });
      return { success: true, data: items };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to fetch user watch history." };
    }
  },

  async remove(userId: string, orderId: string) {
    try {
      await prisma.watchHistory.delete({
        where: {
          userId_orderId: { userId, orderId },
        },
      });
      return { success: true, message: "Removed from watch history." };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to remove from watch history." };
    }
  },
};
