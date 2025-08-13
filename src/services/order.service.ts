import { cacheKeys } from "../utils/cacheKeys.js";
import { setLastUpdated } from "../utils/cacheManager.js";
import { orderModel } from "../models/order.model.js";
import { boostPlanModel } from "../models/boost-plan.model.js";
import { WalletModel } from "../models/wallet.model.js";

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
