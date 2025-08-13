import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";

export const makeOrder = async (req: Request, res: Response) => {
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
};
