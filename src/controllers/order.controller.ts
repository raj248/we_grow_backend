import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { orderModel } from "models/order.model.js";

export const orderController = {
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
        return res.status(400).json({ message: "User ID is required" });
      }

      const order = await orderModel.getUniqueUnwatchedOrder(userId);

      if (!order) {
        return res.status(404).json({ message: "No unwatched videos available" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error getting random video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
