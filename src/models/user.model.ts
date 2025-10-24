import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/log.js";
import { subHours } from "date-fns";

const prisma = new PrismaClient();

export const UserModel = {
  async getAll() {
    try {
      const users = await prisma.user.findMany({
        include: { wallet: true },
      });
      return { success: true, data: users };
    } catch (error) {
      logger.error(error);
      return { success: false, error: "Failed to fetch users." };
    }
  },
  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { userId },
        include: { wallet: true },
      });
      return { success: true, data: user };
    } catch (error) {
      logger.error(error);
      return { success: false, error: "Failed to fetch user." };
    }
  },
  async upsertUser(userId: string, fcmToken?: string) {
    try {
      const user = await prisma.user.upsert({
        where: { userId },
        update: { fcmToken },
        create: {
          userId,
          fcmToken,
          wallet: {
            create: {
              balance: 50, // initial balance
            },
          },
          transactions: {
            create: {
              type: "CREDIT",
              amount: 50,
              transactionId: `initial_${userId}`,
              source: "initial",
              status: "SUCCESS",
            },
          },
        },
        include: { wallet: true },
      });

      return { success: true, data: user };
    } catch (error) {
      logger.error(error);
      return { success: false, error: "Failed to register user." };
    }
  },
  async updateFcmToken(userId: string, fcmToken: string) {
    try {
      const user = await prisma.user.findUnique({ where: { userId: userId } });

      if (user) {
        const updatedUser = await prisma.user.update({
          where: { userId: userId },
          data: { fcmToken },
        });

        return {
          success: true,
          data: updatedUser,
          message: "FCM token updated successfully.",
        };
      } else {
        const newUser = await this.upsertUser(userId, fcmToken);
        return {
          success: true,
          data: newUser,
          message: "User not found. New user created and FCM token registered.",
        };
      }
    } catch (error) {
      return { success: false, error: `Database error: ${error}` };
    }
  },
  async updateLastActive(userId: string) {
    try {
      const updated = await prisma.user.update({
        where: { userId },
        data: { lastActiveAt: new Date() },
      });
      return { success: true };
    } catch (error) {
      logger.error(error);
      return { success: false, error: "Failed to update last active time." };
    }
  },
  async getActiveLast24Hours() {
    try {
      const since = subHours(new Date(), 24);
      const count = await prisma.user.count({
        where: {
          lastActiveAt: { gte: since },
        },
      });
      return { success: true, data: count };
    } catch (error) {
      logger.error(error);
      return { success: false, error: "Failed to count active users." };
    }
  },

  async refundUser(orderId: string) {
    try {
      if (!orderId) {
        return { success: false, error: "Invalid order ID." };
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: orderId },
      });

      if (!transaction) {
        return { success: false, error: "Transaction not found." };
      }

      if (transaction.status === "REFUNDED") {
        return { success: false, error: "Transaction already refunded." };
      }

      const topupOption = await prisma.topupOptions.findUnique({
        where: { id: transaction.topUpId },
      });

      if (!topupOption) {
        return { success: false, error: "Top-up option not found." };
      }

      const refundAmount = topupOption.coins; // Assuming refund is the full price of the boost plan

      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: transaction.userId },
          data: {
            balance: { decrement: refundAmount },
          },
        }),
        prisma.transaction.update({
          where: { id: orderId },
          data: {
            status: "REFUNDED",
          },
        }),
      ]);

      return { success: true, message: "User refunded successfully." };
    } catch (error) {
      logger.error(`UserModel.refundUser: ${error}`);
      return { success: false, error: "Failed to refund user." };
    }
  },
};
