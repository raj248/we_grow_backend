import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { Request, Response } from "express";
import { cacheKeys } from "../utils/cacheKeys.js";
import { setLastUpdated } from "../utils/cacheManager.js";

export const topupCoins = async (req: Request, res: Response) => {
  try {
    const { userId, purchaseToken, id } = req.body;

    // Simulate fake purchase validation
    if (!purchaseToken || !id) {
      return res.status(400).json({ message: "Invalid purchase data" });
    }

    // Check purchase option
    const option = await prisma.topupOptions.findUnique({
      where: { id: id },
    });

    if (!option) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const fakeOrderId = `dummy_${purchaseToken.slice(0, 10)}`;

    // Check if already processed
    const alreadyExists = await prisma.transaction.findUnique({
      where: { transactionId: fakeOrderId },
    });

    if (alreadyExists) {
      return res.status(200).json({
        success: false,
        error: "Already processed",
        message: "Already processed",
      });
    }

    // Credit coins and log transaction
    const [transaction, wallet] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          amount: option.coins,
          type: "CREDIT",
          source: "Debug Purchase",
          status: "SUCCESS",
          transactionId: fakeOrderId,
        },
      }),
      prisma.wallet.update({
        where: { userId },
        data: {
          balance: { increment: option.coins },
        },
      }),
    ]);
    setLastUpdated(cacheKeys.transactionInfo(userId));
    return res.status(200).json({
      success: true,
      message: "Purchase successful",
      transaction,
      wallet,
    });
  } catch (err) {
    console.error("[topupCoins]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
