import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { orderModel } from "../models/order.model.js";
import { generateEarningToken } from "../utils/earnToken.js";
import { setLastUpdated } from "../utils/cacheManager.js";
import { cacheKeys } from "../utils/cacheKeys.js";

export const orderController = {
  async getAll(req: Request, res: Response) {
    try {
      const orders = await orderModel.getAll();
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("[getAllOrders]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await orderModel.getById(id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      return res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error("[getById]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
  async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const orders = await orderModel.getOrdersByUserId(userId);
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("[getOrders]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
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

      setLastUpdated(cacheKeys.orderInfo(userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json(result);
    } catch (err) {
      console.error("[makeOrder]", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Order ID is required" });
      }

      if (!status) {
        return res
          .status(400)
          .json({ success: false, message: "Status is required" });
      }

      const result = await orderModel.updateOrderStatus(id, status);

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.error });
      }

      setLastUpdated(cacheKeys.orderInfo(result.data.userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error("[updateOrderStatus]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async updateOrderProgressViewCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Order ID is required" });
      }
      const { progressViewCount } = req.body;

      const result = await orderModel.updateOrderProgressViewCount(
        id,
        progressViewCount
      );

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.error });
      }

      setLastUpdated(cacheKeys.orderInfo(result.data.userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error("[updateOrderProgressViewCount]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async updateOrderProgressLikeCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Order ID is required" });
      }
      const { progressLikeCount } = req.body;

      const result = await orderModel.updateOrderProgressLikeCount(
        id,
        progressLikeCount
      );

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.error });
      }

      setLastUpdated(cacheKeys.orderInfo(result.data.userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error("[updateOrderProgressLikeCount]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async updateOrderProgressSubscriberCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Order ID is required" });
      }
      const { progressSubscriberCount } = req.body;

      const result = await orderModel.updateOrderProgressSubscriberCount(
        id,
        progressSubscriberCount
      );

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.error });
      }

      setLastUpdated(cacheKeys.orderInfo(result.data.userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error("[updateOrderProgressSubscriberCount]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async deleteOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Order ID is required" });
      }

      const result = await orderModel.deleteOrder(id);

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.error });
      }

      setLastUpdated(cacheKeys.orderInfo(result.data.userId));
      setLastUpdated(cacheKeys.orderList());
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error("[deleteOrder]", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async getRandomVideo(req: Request, res: Response) {
    try {
      const { userId } = req.params; // or req.user?.id if using auth middleware

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, error: "User ID is required" });
      }

      const order = await orderModel.getUniqueUnwatchedOrder(userId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "No unwatched videos available" });
      }
      const token = generateEarningToken(userId, order.id, order.userId);

      res.json({
        success: true,
        data: {
          url: order.url,
          token,
          duration: order.boostPlan.duration,
          reward: order.boostPlan.reward,
        },
      });
    } catch (error) {
      console.error("Error getting random video:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
  async getReward(req: Request, res: Response) {
    try {
      const { token, duration } = req.body;

      const result = await orderService.processEarning(token, duration);

      if (!result.success) {
        return res
          .status(result.statusCode)
          .json({ success: false, error: result.message });
      }

      return res.status(200).json({
        success: true,
        data: { message: result.message, rewardAmount: result.rewardAmount },
      });
    } catch (error) {
      console.error("Error processing reward:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
};
