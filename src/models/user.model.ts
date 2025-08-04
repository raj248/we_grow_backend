import { PrismaClient } from '@prisma/client';
import { logger } from '~/utils/log';
import { subHours } from 'date-fns';

const prisma = new PrismaClient();

export const UserModel = {
  async upsertUser(userId: string, fcmToken?: string) {
    try {
      const user = await prisma.user.upsert({
        where: { userId },
        update: { fcmToken },
        create: { userId, fcmToken },
      });
      return { success: true, data: user };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to register user.' };
    }
  },

  async updateFcmToken(userId: string, fcmToken: string) {
    try {
      const user = await prisma.user.findUnique({ where: { userId: userId } });

      if (user) {
        await prisma.user.update({
          where: { userId: userId },
          data: { fcmToken },
        });

        return { success: true, message: "FCM token updated successfully." };
      } else {
        await prisma.user.create({
          data: {
            userId: userId,
            fcmToken,
            // optionally add other default fields
          },
        });

        return { success: true, message: "User not found. New user created and FCM token registered." };
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
      return { success: false, error: 'Failed to update last active time.' };
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
      return { success: false, error: 'Failed to count active users.' };
    }
  },
};
