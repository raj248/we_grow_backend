import { TopupModel } from "../models/topup.model.js";
import { logger } from "../utils/log.js";
import type { Request, Response } from "express";
import { setLastUpdated } from "../utils/cacheManager.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import {
  consumeProduct,
  verifyAndroidPurchase,
} from "../services/validate.service.js";
import { PrismaClient } from "@prisma/client";
import { androidpublisher_v3 } from "googleapis";
const prisma = new PrismaClient();

import { Mutex } from "async-mutex";

const transactionMutexes = new Map<string, Mutex>();

export const TopupController = {
  async validateReceipt(req: Request, res: Response) {
    const { productId, purchaseToken, transactionId, packageNameAndroid } =
      req.body;
    logger.log({
      "Request Body": {
        productId,
        purchaseToken,
        transactionId,
        packageNameAndroid,
      },
    });
    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: "Missing productId" });
    if (!purchaseToken && !transactionId)
      return res.status(400).json({
        success: false,
        message: "Missing purchaseToken or transactionId",
      });

    const transactionKey = transactionId || purchaseToken;

    // Get or create a mutex for this transaction
    let mutex = transactionMutexes.get(transactionKey);
    if (!mutex) {
      mutex = new Mutex();
      transactionMutexes.set(transactionKey, mutex);
    } else {
      logger.log(
        `Request is being processed: ${transactionKey} mutex locked: ${mutex.isLocked()}`
      );
    }

    return mutex.runExclusive(async () => {
      try {
        let verificationResult: androidpublisher_v3.Schema$ProductPurchase;
        if (purchaseToken && packageNameAndroid) {
          verificationResult = await verifyAndroidPurchase(
            packageNameAndroid,
            productId,
            purchaseToken
          );
        } else {
          return res.status(400).json({
            success: false,
            message: "Insufficient data for verification",
          });
        }

        if (verificationResult.purchaseState === Number(1)) {
          // return purchase cancelled by user
          return res.status(400).json({
            success: false,
            message: "Purchase cancelled by user",
          });
        } else if (verificationResult.purchaseState === Number(2)) {
          // save as a pending transaction
          await prisma.transaction.upsert({
            where: { transactionId: transactionKey },
            update: { status: "PENDING" },
            create: {
              userId: req.body.userId,
              amount: 0, // Amount will be updated upon successful purchase
              type: "CREDIT",
              source: "Google Play Purchase",
              status: "PENDING",
              transactionId: transactionKey,
            },
          });
          setLastUpdated(cacheKeys.transactionInfo(req.body.userId));
          // return purchase pending
          return res.status(200).json({
            success: false,
            message: "Purchase pending",
          });
        } else if (verificationResult.purchaseState !== 0) {
          // save as failed transaction
          await prisma.transaction.upsert({
            where: { transactionId: transactionKey },
            update: { status: "FAILED" },
            create: {
              userId: req.body.userId,
              amount: 0,
              type: "CREDIT",
              source: "Google Play Purchase",
              status: "FAILED",
              transactionId: transactionKey,
            },
          });
          setLastUpdated(cacheKeys.transactionInfo(req.body.userId));
          return res.status(400).json({
            success: false,
            message: "Purchase verification failed",
          });
        }

        // Check if transaction already exists
        let existingTransaction = await prisma.transaction.findUnique({
          where: { transactionId: transactionKey },
        });

        // If not found and a transactionId exists, check for pending row with purchaseToken
        if (!existingTransaction && transactionId && purchaseToken) {
          existingTransaction = await prisma.transaction.findUnique({
            where: { transactionId: purchaseToken },
          });

          if (existingTransaction) {
            // Update the row with the real transactionId and mark as SUCCESS
            await prisma.transaction.update({
              where: { transactionId: purchaseToken },
              data: {
                transactionId: transactionId, // switch to real ID
              },
            });
          }
        }

        if (existingTransaction?.status === "SUCCESS") {
          logger.log("Transaction already exists and verified.");
          return res.status(200).json({
            success: true,
            message: "Purchase already verified and coins granted.",
            data: verificationResult,
          });
        }

        // check for consumed state and return already verified
        if (verificationResult.consumptionState !== 0 && existingTransaction) {
          logger.log(
            `Transaction exists with ${existingTransaction.status}  not yet consumed`
          );

          return res.status(200).json({
            success: true,
            message: "Purchase already verified and coins granted.",
            data: verificationResult,
          });
        }

        // Grant coins to the user
        const topupOption = await TopupModel.getById(productId);
        if (!topupOption.success || !topupOption.data) {
          return res.status(404).json({
            success: false,
            message: "Topup option not found for the given product ID.",
          });
        }

        const coinsToGrant = topupOption.data.coins;
        const userId = req.body.userId;
        if (!userId)
          return res
            .status(400)
            .json({ success: false, message: "User ID is required." });

        // check for yet to be consumed state for an existing transaction
        if (existingTransaction && verificationResult.consumptionState === 0) {
          // consume product
          logger.log(`Transaction exists with ${existingTransaction.status}`);
          consumeProduct(packageNameAndroid, productId, purchaseToken).then(
            async () => {
              logger.log("Consumed product successfully.");
              // update the user wallet and transaction in a prisma.$transaction

              const [updatedWallet, transactionRecord] =
                await prisma.$transaction([
                  prisma.wallet.update({
                    where: { userId },
                    data: { balance: { increment: coinsToGrant } },
                  }),
                  prisma.transaction.update({
                    where: { transactionId: transactionKey },
                    data: {
                      amount: coinsToGrant,
                      status: "SUCCESS",
                    },
                  }),
                ]);
              setLastUpdated(cacheKeys.wallet(userId));
              setLastUpdated(cacheKeys.transactionInfo(userId));
            }
          );
          return res.status(200).json({
            success: true,
            message: "Purchase verified and coins granted.",
            data: verificationResult,
          });
        }

        const [updatedWallet, transactionRecord] = await prisma.$transaction([
          prisma.wallet.update({
            where: { userId },
            data: { balance: { increment: coinsToGrant } },
          }),
          prisma.transaction.create({
            data: {
              userId,
              amount: coinsToGrant,
              type: "CREDIT",
              source: "Google Play Purchase",
              status: "SUCCESS",
              transactionId: transactionKey,
            },
          }),
        ]);

        setLastUpdated(cacheKeys.wallet(userId));
        setLastUpdated(cacheKeys.transactionInfo(userId));

        await consumeProduct(packageNameAndroid, productId, purchaseToken);

        return res.status(200).json({
          success: true,
          message: "Purchase verified successfully",
          data: verificationResult,
        });
      } catch (error) {
        logger.error(`TopupController.validateReceipt: ${error}`);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });
  },
  async create(req: Request, res: Response) {
    const { id, coins, googleProductId } = req.body;
    const result = await TopupModel.create({ id, coins, googleProductId });

    if (result.success) {
      setLastUpdated(cacheKeys.TopupOptionList());
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
      setLastUpdated(cacheKeys.TopupOptionList());
      if (result.data && result.data.id)
        setLastUpdated(cacheKeys.purchaseOptionInfo(result.data.id));
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
      setLastUpdated(cacheKeys.TopupOptionList());
      if (result.data && result.data.id)
        setLastUpdated(cacheKeys.purchaseOptionInfo(result.data.id));
      return res.status(200).json({ message: "Deleted successfully." });
    } else {
      logger.error(result.error);
      return res.status(500).json({ error: result.error });
    }
  },
};
