/*
  Warnings:

  - You are about to drop the column `guestId` on the `GuestUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `GuestUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `GuestUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GuestUser_guestId_key";

-- AlterTable
ALTER TABLE "GuestUser" DROP COLUMN "guestId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GuestUser_userId_key" ON "GuestUser"("userId");
