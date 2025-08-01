import { Request, Response } from "express";
import { mainModel } from "~/models/main.model";
import { logger } from "~/utils/log";

export const mainController = {
  async list(req: Request, res: Response) {
    try {
      const result = await mainModel.getAll();
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }

    } catch (error) {
      const err = error as Error;
      logger.error(`mainController.list: ${err.message}`);
      res.status(500).json({ success: false, error: "Failed to list main items." });
    }
  },

};
