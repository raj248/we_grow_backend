// orderService.ts

import { cacheKeys } from "../utils/cacheKeys.js";
import { setLastUpdated } from "../utils/cacheManager.js";
import { verifyEarningToken } from "../utils/earnToken.js";

import { checkAndCompleteOrder, orderModel } from "../models/order.model.js";
import { boostPlanModel } from "../models/boost-plan.model.js";
import { WalletModel } from "../models/wallet.model.js";
import { fetchYouTubeDetails } from "../utils/fetchVideoDetails.js";

export const makeOrder = async (
  userId: string,
  planId: string,
  link: string
) => {
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

  const { likeCount, viewCount, thumbnail, title, subscriberCount } =
    await fetchYouTubeDetails(link);

  console.log(
    likeCount,
    viewCount,
    thumbnail,
    title,
    subscriberCount,
    plan.data
  );
  // check if title and thumbnail is not undefined else reject say try again later
  if (!title || !thumbnail) {
    return {
      success: false,
      statusCode: 400,
      message:
        "Could not fetch video details. Please check the URL or try again later.",
    };
  }

  // Create order and transaction atomically
  const [order, updatedWallet, transaction] =
    await orderModel.createOrderWithTransaction(
      orderId,
      userId,
      planId,
      link,
      plan.data.price,
      Number(viewCount),
      Number(likeCount),
      Number(subscriberCount)
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

export async function processEarning(token: string, duration: number) {
  try {
    const verifiedData = verifyEarningToken(token);

    if (!verifiedData.verified) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid or expired earning token",
      };
    }
    console.log(verifiedData);
    const { userId, orderId, clientId } = verifiedData;

    const isValid = await boostPlanModel.verifyDuration(orderId, duration);

    if (!isValid) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid duration",
      };
    }

    const o = await orderModel.getById(orderId);
    if (!o) {
      return {
        success: false,
        statusCode: 404,
        message: "Order not found",
      };
    }
    const REWARD_AMOUNT = o.boostPlan.reward;

    // Update user wallet
    const [wallet, transaction, history, order] =
      await WalletModel.rewardWithTransaction(
        userId,
        orderId,
        REWARD_AMOUNT,
        token.slice(-10)
      );
    if (!wallet || !transaction || !history || !order) {
      return {
        success: false,
        statusCode: 500,
        message: "Failed to process reward transaction",
      };
    }
    await checkAndCompleteOrder(orderId);

    setLastUpdated(cacheKeys.wallet(userId));
    setLastUpdated(cacheKeys.orderInfo(userId));
    setLastUpdated(cacheKeys.transactionInfo(userId));

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
