import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { logger } from '~/utils/log';

export const PurchaseOptionModel = {
  async create(data: { coins: number; googleProductId: string }) {
    try {
      const option = await prisma.purchaseOption.create({
        data,
      });
      return { success: true, data: option };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to create purchase option.' };
    }
  },

  async getAll(activeOnly = true) {
    try {
      const options = await prisma.purchaseOption.findMany({
        where: activeOnly ? { isActive: true } : {},
        orderBy: { coins: 'asc' },
      });
      return { success: true, data: options };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to fetch purchase options.' };
    }
  },

  async getById(id: string) {
    try {
      const option = await prisma.purchaseOption.findUnique({
        where: { id },
      });
      return option
        ? { success: true, data: option }
        : { success: false, error: 'Purchase option not found.' };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to fetch purchase option.' };
    }
  },

  async updateById(
    id: string,
    data: Partial<{ coins: number; googleProductId: string; isActive: boolean }>
  ) {
    try {
      const updated = await prisma.purchaseOption.update({
        where: { id },
        data,
      });
      return { success: true, data: updated };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to update purchase option.' };
    }
  },

  async deleteById(id: string) {
    try {
      const deleted = await prisma.purchaseOption.delete({
        where: { id },
      });
      return { success: true, data: deleted };
    } catch (error) {
      logger.error(error);
      return { success: false, error: 'Failed to delete purchase option.' };
    }
  },
};
