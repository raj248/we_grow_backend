import type { Prisma } from "@prisma/client";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBoostPlans() {
  const plans = [
    {
      title: 'Starter Pack',
      views: 100,
      price: 10, // in coins
      duration: 15, // in days
    },
    {
      title: 'Growth Pack',
      views: 500,
      price: 40,
      duration: 35,
    },
    {
      title: 'Pro Pack',
      views: 1000,
      price: 70,
      duration: 55,
    },
    {
      title: 'Influencer Pack',
      views: 5000,
      price: 300,
      duration: 75,
    },
  ];

  for (const plan of plans) {
    const exists = await prisma.boostPlan.findFirst({
      where: { title: plan.title },
    });

    if (!exists) {
      await prisma.boostPlan.create({ data: plan });
    }
  }


  console.log('✅ Boost plans seeded');
}
