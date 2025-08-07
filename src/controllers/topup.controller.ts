import { TopupModel } from '../models/topup.model.js';
import { logger } from '../utils/log.js';
import type { Request, Response } from 'express';
import { setLastUpdated } from '../utils/cacheManager.js';
import { cacheKeys } from '../utils/cacheKeys.js';

export const TopupController = {
  async create(req: Request, res: Response) {
    const { coins, googleProductId } = req.body;
    const result = await TopupModel.create({ coins, googleProductId });

    if (result.success) {
      setLastUpdated(cacheKeys.purchaseOptionList())
      return res.status(201).json(result);
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },

  async getAll(req: Request, res: Response) {
    const result = await TopupModel.getAll();

    if (result.success) {
      return res.status(200).json(result);
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await TopupModel.getById(id);

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

    const result = await TopupModel.updateById(id, {
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
    const result = await TopupModel.deleteById(id);

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
