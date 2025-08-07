import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const TopupOptions = [
    {
      coins: 100,
      priceInINR: 5000, // ₹50.00 in paisa
      googleProductId: "coins_100",
    },
    {
      coins: 250,
      priceInINR: 12000, // ₹120.00
      googleProductId: "coins_250",
    },
    {
      coins: 500,
      priceInINR: 22000, // ₹220.00
      googleProductId: "coins_500",
    },
    {
      coins: 1000,
      priceInINR: 40000, // ₹400.00
      googleProductId: "coins_1000",
    },
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

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
