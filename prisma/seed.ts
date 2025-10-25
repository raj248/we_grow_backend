import { PrismaClient } from "@prisma/client";
import { seedBoostPlans } from "./seed-data.js";
import { hashPassword } from "./../src/utils/auth.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await hashPassword("yt@pp_2025_r*aln&");

  // add randon dummy user x10

  await prisma.admin.create({
    data: {
      username: "admin@sk?.booster.n0th1n9",
      password, // now hashed
    },
  });

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
