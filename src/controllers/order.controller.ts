import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { Request, Response } from "express";
import { cacheKeys } from '../utils/cacheKeys.js';
import { setLastUpdated } from '../utils/cacheManager.js';

export const makeOrder = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ message: "Missing userId or planId" });
    }

    // Fetch the plan details
    const plan = await prisma.boostPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ message: "Invalid plan ID" });
    }

    // Get user's current balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < plan.price) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const orderId = `order_${userId}_${Date.now()}`;

    // Perform atomic transaction
    const [order, updatedWallet, transaction] = await prisma.$transaction([
      prisma.order.create({
        data: {
          id: orderId,
          userId,
          planId,
          status: "PENDING", // or "PROCESSING"
        },
      }),
      prisma.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: plan.price },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: plan.price,
          type: "DEBIT",
          source: "Plan Purchase",
          status: "SUCCESS",
          transactionId: orderId,
        },
      }),
    ]);

    setLastUpdated(cacheKeys.transactionInfo(userId));
    setLastUpdated(cacheKeys.wallet(userId));

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order,
      transaction,
      wallet: updatedWallet,
    });
  } catch (err) {
    console.error("[makeOrder]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


