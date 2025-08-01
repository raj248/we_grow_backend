import { PrismaClient } from '@prisma/client';
import { logger } from '~/utils/log';

const prisma = new PrismaClient();

export const UserModel = {
  async upsertGuest(guestId: string, fcmToken?: string) {
    try {
      const guest = await prisma.guestUser.upsert({
        where: { guestId },
        update: { fcmToken },
        create: { guestId, fcmToken },
      });
      return { success: true, data: guest };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to register guest.' };
    }
  },

  async updateFcmToken(id: string, fcmToken: string) {
    try {
      const updated = await prisma.guestUser.update({
        where: { guestId: id },
        data: { fcmToken },
      });
      return { success: true, data: updated };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to update FCM token.' };
    }
  }
};
