import { PrismaClient, PlanType } from "@prisma/client";
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

  async getByType(type: PlanType) {
    try {
      const items = await prisma.boostPlan.findMany({
        where: { type },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: items };
    } catch (error) {
      console.error("[boostPlanModel.getByType]", error);
      return { success: false, error: "Failed to fetch boost plans by type." };
    }
  },

  async create(data: {
    type: PlanType;
    title: string;
    description?: string;
    price: number;
    views?: number;
    likes?: number;
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
      type: PlanType;
      title: string;
      description: string;
      price: number;
      views: number;
      likes: number;
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

  async upsert(plan: {
    id: string;
    type: PlanType;
    title: string;
    description?: string;
    price: number;
    views?: number;
    likes?: number;
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
};
