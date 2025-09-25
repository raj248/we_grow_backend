import { TopupModel } from "../models/topup.model.js";
import { logger } from "../utils/log.js";
import type { Request, Response } from "express";
import { setLastUpdated } from "../utils/cacheManager.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import {
  consumeProduct,
  verifyAndroidPurchase,
} from "services/validate.service.js";
import { PrismaClient } from "@prisma/client";
import { androidpublisher_v3 } from "googleapis";
const prisma = new PrismaClient();

type Receipt = {
  productId: string;
  purchaseToken: string | null | undefined;
  transactionId: string | null | undefined;
  packageNameAndroid: string | null | undefined;
};
export const TopupController = {
  async validateReceipt(req: Request, res: Response) {
    const { productId, purchaseToken, transactionId, packageNameAndroid } =
      req.body;
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing productId" });
    }

    if (!purchaseToken && !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing purchaseToken or transactionId",
      });
    }

    try {
      let verificationResult: androidpublisher_v3.Schema$ProductPurchase;
      if (purchaseToken && packageNameAndroid) {
        // Assume Android purchase
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

      if (verificationResult.purchaseState === 0) {
        // Here, you would typically:
        // 1. Check if the purchase has already been consumed/granted to prevent replay attacks.
        // 2. Grant the user the purchased coins/items.
        // 3. Record the purchase in your database.
        // 4. Acknowledge the purchase with the store (Google Play/App Store).
        // const transaction = await prisma.transaction.findUnique({
        //     where: { transactionId },
        // });
        await consumeProduct(packageNameAndroid, productId, purchaseToken);

        // For now, just return the verification success
        return res.status(200).json({
          success: true,
          message: "Purchase verified successfully",
          data: verificationResult,
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            verificationResult.developerPayload ||
            "Purchase verification failed",
          error: verificationResult.developerPayload,
        });
      }
    } catch (error) {
      logger.error(`TopupController.validateReceipt: ${error}`);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
  async create(req: Request, res: Response) {
    const { coins, googleProductId } = req.body;
    const result = await TopupModel.create({ coins, googleProductId });

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
