import { Request, Response } from "express";
import { UserModel } from "../models/user.model.js";
import { logger } from "../utils/log.js";

export const UserController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserModel.getAll();
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error(`UserController.getAll: ${error}`);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await UserModel.getUserById(id);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error(`UserController.getById: ${error}`);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
  async registerUser(req: Request, res: Response): Promise<void> {
    const { userId, fcmToken } = req.body;

    if (!userId || userId.length !== 8) {
      res
        .status(400)
        .json({ success: false, error: "Invalid or missing userId" });
      return;
    }

    const result = await UserModel.upsertUser(userId, fcmToken);

    if (!result.success) {
      logger.error(`UserController.registerUser: ${result.error}`);
      res.status(500).json(result);
      return;
    }

    res.status(201).json(result);
  },
  async updateFcmToken(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { fcmToken } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: "Missing User ID" });
      return;
    }

    if (!fcmToken || typeof fcmToken !== "string") {
      res
        .status(400)
        .json({ success: false, error: "Missing or invalid fcmToken" });
      return;
    }

    const result = await UserModel.updateFcmToken(id, fcmToken);

    if (!result.success) {
      logger.error(`UserController.updateFcmToken: ${result.error}`);
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    res.status(200).json({ success: true, message: result.error });
  },
  async updateLastActive(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res
        .status(400)
        .json({ success: false, error: "Missing or invalid userId" });
      return;
    }

    const result = await UserModel.updateLastActive(id);

    if (!result.success) {
      logger.error(`UserController.updateLastActive: ${result.error}`);
      res.status(500).json(result);
      return;
    }

    res.json(result);
  },
  async getActiveUsersLast24Hrs(req: Request, res: Response) {
    try {
      const result = await UserModel.getActiveLast24Hours();
      res.json(result);
    } catch (error) {
      console.error("Error getting active users:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
};
