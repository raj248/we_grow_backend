import { PurchaseOptionModel } from '~/models/purchase-option.model';
import { logger } from '~/utils/log';
import type { Request, Response } from 'express';
import { setLastUpdated } from '~/utils/cacheManager';
import { cacheKeys } from '~/utils/cacheKeys';

export const PurchaseOptionController = {
  async create(req: Request, res: Response) {
    const { coins, googleProductId } = req.body;
    const result = await PurchaseOptionModel.create({ coins, googleProductId });

    if (result.success) {
      setLastUpdated(cacheKeys.purchaseOptionList())
      return res.status(201).json(result);
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },

  async getAll(req: Request, res: Response) {
    const result = await PurchaseOptionModel.getAll();

    if (result.success) {
      return res.status(200).json(result);
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await PurchaseOptionModel.getById(id);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      logger.error(result.error);
      return res.status(404).json({ error: result.error });
    }
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { coins, googleProductId, isActive } = req.body;

    const result = await PurchaseOptionModel.updateById(id, {
      coins,
      googleProductId,
      isActive,
    });

    if (result.success) {
      setLastUpdated(cacheKeys.purchaseOptionList())
      if (result.data && result.data.id) setLastUpdated(cacheKeys.purchaseOptionInfo(result.data.id))
      return res.status(200).json(result);
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await PurchaseOptionModel.deleteById(id);

    if (result.success) {
      setLastUpdated(cacheKeys.purchaseOptionList())
      if (result.data && result.data.id) setLastUpdated(cacheKeys.purchaseOptionInfo(result.data.id))
      return res.status(200).json({ message: 'Deleted successfully.' });
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },
};
