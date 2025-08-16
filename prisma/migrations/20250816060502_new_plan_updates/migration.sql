/*
  Warnings:

  - You are about to drop the column `likes` on the `BoostPlan` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `BoostPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BoostPlan" DROP COLUMN "likes",
DROP COLUMN "type",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0;
