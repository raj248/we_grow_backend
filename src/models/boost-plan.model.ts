import { PrismaClient, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

// 🔹 Get all boost plans
export async function getAllBoostPlans() {
  return prisma.boostPlan.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// 🔹 Get a boost plan by ID
export async function getBoostPlanById(id: string) {
  return prisma.boostPlan.findUnique({
    where: { id },
  });
}

// 🔹 Get all boost plans by type
export async function getBoostPlansByType(type: PlanType) {
  return prisma.boostPlan.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
  });
}

// 🔹 Create a new boost plan
export async function createBoostPlan(data: {
  type: PlanType;
  title: string;
  description?: string;
  price: number;
  views?: number;
  likes?: number;
  isActive?: boolean;
}) {
  return prisma.boostPlan.create({ data });
}

// 🔹 Update a boost plan by ID
export async function updateBoostPlan(id: string, data: Partial<{
  type: PlanType;
  title: string;
  description: string;
  price: number;
  views: number;
  likes: number;
  isActive: boolean;
}>) {
  return prisma.boostPlan.update({
    where: { id },
    data,
  });
}

// 🔹 Soft delete (deactivate) a boost plan
export async function deactivateBoostPlan(id: string) {
  return prisma.boostPlan.update({
    where: { id },
    data: { isActive: false },
  });
}

// 🔹 Reactivate a boost plan
export async function activateBoostPlan(id: string) {
  return prisma.boostPlan.update({
    where: { id },
    data: { isActive: true },
  });
}

// 🔹 Upsert boost plan by ID
export async function upsertBoostPlan(plan: {
  id: string;
  type: PlanType;
  title: string;
  description?: string;
  price: number;
  views?: number;
  likes?: number;
  isActive?: boolean;
}) {
  return prisma.boostPlan.upsert({
    where: { id: plan.id },
    update: plan,
    create: plan,
  });
}
