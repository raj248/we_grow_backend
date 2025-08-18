import { PrismaClient } from "@prisma/client";
import { seedBoostPlans } from "./seed-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedBoostPlans();
  // 1. TopupOptions
  const TopupOptions = [
    { coins: 100, googleProductId: "coins_100" },
    { coins: 250, googleProductId: "coins_250" },
    { coins: 500, googleProductId: "coins_500" },
    { coins: 1000, googleProductId: "coins_1000" },
  ];

  for (const option of TopupOptions) {
    await prisma.topupOptions.upsert({
      where: { googleProductId: option.googleProductId },
      update: {},
      create: {
        coins: option.coins,
        googleProductId: option.googleProductId,
      },
    });
  }

  // 2. BoostPlans

  // 3. Dummy User
  const dummyUser = await prisma.user.upsert({
    where: { userId: "dummy_user_123" },
    update: {},
    create: {
      userId: "dummy_user_123",
      fcmToken: null,
      wallet: {
        create: {
          balance: 500, // give them some coins
        },
      },
    },
    include: { wallet: true },
  });

  // 4. Fetch one boost plan to attach orders
  const firstPlan = await prisma.boostPlan.findFirst();
  if (!firstPlan) {
    throw new Error("No BoostPlan found! Run seedBoostPlans first.");
  }

  // 5. Create Dummy Orders
  await prisma.order.createMany({
    data: [
      {
        userId: dummyUser.userId,
        planId: firstPlan.id,
        url: "https://youtu.be/7i_dwP2n90M?si=7GYUB5UQ3nVeEhx4",
        completedCount: 0,
        status: "ACTIVE",
      },
      {
        userId: dummyUser.userId,
        planId: firstPlan.id,
        url: "https://youtu.be/La2w7GlXr2o?si=JXzHsm4ornRuBdgK",
        completedCount: 2,
        status: "ACTIVE",
      },
      {
        userId: dummyUser.userId,
        planId: firstPlan.id,
        url: "https://youtu.be/pbjR20eTLVs?si=-0wjBoEGx6P1T8p3",
        completedCount: 0,
        status: "ACTIVE",
      },
      {
        userId: dummyUser.userId,
        planId: firstPlan.id,
        url: "https://youtu.be/t2qlo43S_C0?si=ZHaJsJCtQyLAcB6D",
        completedCount: 2,
        status: "ACTIVE",
      },
    ],
  });

  console.log("✅ Seeding complete with dummy user + orders!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
