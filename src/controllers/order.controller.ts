import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { orderModel } from "models/order.model.js";
import { generateEarningToken } from "utils/earnToken.js";
import { setLastUpdated } from "utils/cacheManager.js";
import { cacheKeys } from "utils/cacheKeys.js";

export const orderController = {
  async getAll(req: Request, res: Response) {
    try {
      const orders = await orderModel.getAll();
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("[getAllOrders]", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const orders = await orderModel.getOrdersByUserId(userId);
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("[getOrders]", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  async makeOrder(req: Request, res: Response) {
    try {
      const { userId, planId, link } = req.body;

      if (!userId || !planId || !link) {
        return res
          .status(400)
          .json({ message: "Missing userId or planId or link" });
      }

      const result = await orderService.makeOrder(userId, planId, link);

      if (!result.success) {
        return res.status(result.statusCode).json({ message: result.message });
      }

      setLastUpdated(cacheKeys.orderInfo(userId))
      setLastUpdated(cacheKeys.orderList())
      return res.status(200).json(result);
    } catch (err) {
      console.error("[makeOrder]", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  async getRandomVideo(req: Request, res: Response) {
    try {
      const { userId } = req.params; // or req.user?.id if using auth middleware

      if (!userId) {
        return res.status(400).json({ success: false, error: "User ID is required" });
      }

      const order = await orderModel.getUniqueUnwatchedOrder(userId);

      if (!order) {
        return res.status(404).json({ success: false, error: "No unwatched videos available" });
      }
      const token = generateEarningToken(userId, order.id)

      res.json({ success: true, data: { url: order.url, token } });
    } catch (error) {
      console.error("Error getting random video:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
  async getReward(req: Request, res: Response) {
    try {
      const { token, duration } = req.body;

      const result = await orderService.processEarning(token);

      if (!result.success) {
        return res.status(result.statusCode).json({ success: false, error: result.message });
      }

      return res.status(200).json({ success: true, data: { message: result.message, rewardAmount: result.rewardAmount } });
    } catch (error) {
      console.error("Error processing reward:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
};
