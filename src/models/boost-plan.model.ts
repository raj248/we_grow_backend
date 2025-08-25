import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const boostPlanModel = {
  async getAll() {
    try {
      const items = await prisma.boostPlan.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: items };
    } catch (error) {
      console.error("[boostPlanModel.getAll]", error);
      return { success: false, error: "Failed to fetch boost plans." };
    }
  },

  async getById(id: string) {
    try {
      const item = await prisma.boostPlan.findUnique({ where: { id } });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.getById]", error);
      return { success: false, error: "Failed to fetch boost plan." };
    }
  },

  async create(data: {
    title: string;
    description?: string;
    price: number;
    salePrice?: number;
    views: number;
    duration: number;
    reward: number;
    isActive?: boolean;
  }) {
    try {
      const item = await prisma.boostPlan.create({ data });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.create]", error);
      return { success: false, error: "Failed to create boost plan." };
    }
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      salePrice?: number;
      duration: number;
      reward: number;
      views: number;
      isActive: boolean;
    }>
  ) {
    try {
      const item = await prisma.boostPlan.update({
        where: { id },
        data,
      });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.update]", error);
      return { success: false, error: "Failed to update boost plan." };
    }
  },

  async deactivate(id: string) {
    try {
      const item = await prisma.boostPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.deactivate]", error);
      return { success: false, error: "Failed to deactivate boost plan." };
    }
  },

  async activate(id: string) {
    try {
      const item = await prisma.boostPlan.update({
        where: { id },
        data: { isActive: true },
      });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.activate]", error);
      return { success: false, error: "Failed to activate boost plan." };
    }
  },

  async delete(id: string) {
    try {
      const item = await prisma.boostPlan.delete({ where: { id } });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.delete]", error);
      return { success: false, error: "Failed to delete boost plan." };
    }
  },

  async upsert(plan: {
    id: string;
    title: string;
    description: string;
    price: number;
    salePrice?: number;
    duration: number;
    reward: number;
    views: number;
    isActive?: boolean;
  }) {
    try {
      const item = await prisma.boostPlan.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan,
      });
      return { success: true, data: item };
    } catch (error) {
      console.error("[boostPlanModel.upsert]", error);
      return { success: false, error: "Failed to upsert boost plan." };
    }
  },

  async verifyDuration(orderId: string, duration: number): Promise<boolean> {
    // Fetch order with related plan
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        boostPlan: true,
      },
    });

    if (!order || !order.boostPlan) {
      throw new Error("Order or related plan not found");
    }

    // Compare durations
    return duration >= order.boostPlan.duration;
  },
};
