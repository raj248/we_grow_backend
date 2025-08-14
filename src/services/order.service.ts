// orderService.ts

import { cacheKeys } from "../utils/cacheKeys.js";
import { setLastUpdated } from "../utils/cacheManager.js";
import { verifyEarningToken } from "../utils/earnToken.js";

import { orderModel } from "../models/order.model.js";
import { boostPlanModel } from "../models/boost-plan.model.js";
import { WalletModel } from "../models/wallet.model.js";
import { watchHistoryModel } from "models/watchHistory.model.js";

export const makeOrder = async (userId: string, planId: string, link: string) => {
  // Validate plan
  const plan = await boostPlanModel.getById(planId);
  if (!plan.success || !plan.data) {
    return { success: false, statusCode: 404, message: "Invalid plan ID" };
  }

  // Validate wallet balance
  const wallet = await WalletModel.getWalletByUserId(userId);
  if (!wallet || wallet.balance < plan.data.price) {
    return { success: false, statusCode: 400, message: "Insufficient balance" };
  }

  // Generate order ID
  const orderId = `order_${userId}_${Date.now()}`;

  // Create order and transaction atomically
  const [order, updatedWallet, transaction] =
    await orderModel.createOrderWithTransaction(
      orderId,
      userId,
      planId,
      link,
      plan.data.price
    );

  // Update cache timestamps
  setLastUpdated(cacheKeys.transactionInfo(userId));
  setLastUpdated(cacheKeys.wallet(userId));

  return {
    success: true,
    statusCode: 200,
    data: {
      message: "Order placed successfully",
      order,
      transaction,
      wallet: updatedWallet,
    },
  };
};



const REWARD_AMOUNT = 10; // coins per valid watch, adjust as needed

export async function processEarning(token: string) {
  try {
    const verifiedData = verifyEarningToken(token);

    if (!verifiedData.verified) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid or expired earning token",
      };
    }

    const { userId, orderId } = verifiedData;

    // Update user wallet
    await WalletModel.rewardWithTransaction(userId, REWARD_AMOUNT, token.slice(0, 10));
    setLastUpdated(cacheKeys.wallet(userId))
    setLastUpdated(cacheKeys.transactionInfo(userId))
    // Add to watch history
    await watchHistoryModel.add(userId, orderId);

    return {
      success: true,
      statusCode: 200,
      message: "Reward credited successfully",
      rewardAmount: REWARD_AMOUNT,
    };
  } catch (err) {
    console.error("Error in processEarning:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Internal server error",
    };
  }
}
