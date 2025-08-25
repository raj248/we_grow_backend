import { Request, Response } from "express";
import { boostPlanModel } from "../models/boost-plan.model.js";
import { logger } from "../utils/log.js";
import { setLastUpdated } from "utils/cacheManager.js";
import { cacheKeys } from "utils/cacheKeys.js";

export const boostPlanController = {
  async list(req: Request, res: Response) {
    try {
      const result = await boostPlanModel.getAll();
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.list: ${err.message}`);
      res
        .status(500)
        .json({ success: false, error: "Error fetching boost plans." });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await boostPlanModel.getById(id);

      if (result.success && result.data) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(404).json({ success: false, error: "Plan not found." });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.getById: ${err.message}`);
      res.status(500).json({ success: false, error: "Error fetching plan." });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const {
        title,
        description,
        price,
        duration,
        reward,
        views = 0,
        isActive = true,
      } = req.body;

      if (!title || !price) {
        return res
          .status(400)
          .json({ success: false, error: "Missing required fields." });
      }

      const result = await boostPlanModel.create({
        title,
        description,
        price,
        views,
        duration,
        reward,
        isActive,
      });

      if (result.success) {
        setLastUpdated(cacheKeys.planList());
        res.status(201).json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.create: ${err.message}`);
      res.status(500).json({ success: false, error: "Error creating plan." });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const result = await boostPlanModel.update(id, updates);
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.update: ${err.message}`);
      res.status(500).json({ success: false, error: "Error updating plan." });
    }
  },

  async deactivate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await boostPlanModel.deactivate(id);

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.deactivate: ${err.message}`);
      res
        .status(500)
        .json({ success: false, error: "Error deactivating plan." });
    }
  },

  async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await boostPlanModel.activate(id);

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`boostPlanController.activate: ${err.message}`);
      res.status(500).json({ success: false, error: "Error activating plan." });
    }
  },
};
