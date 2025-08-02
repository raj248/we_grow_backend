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

  async updateFcmToken(id: string, fcmToken: string) {
    try {
      const updated = await prisma.user.update({
        where: { userId: id },
        data: { fcmToken },
      });
      return { success: true };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to update FCM token.' };
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
