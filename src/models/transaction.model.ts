import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { TransactionStatus, TransactionType } from "@prisma/client";

// 🔹 Get all transactions of a user
export async function getAllTransactionsByUserId(userId: string) {
  const result = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!result) return null;
  return { success: true, data: result };

}

// 🔹 Get all transactions by type (for a user)
export async function getTransactionsByType(userId: string, type: TransactionType) {
  return prisma.transaction.findMany({
    where: {
      userId,
      type,
    },
    orderBy: { createdAt: "desc" },
  });
}

// 🔹 Get all transactions by status (for a user)
export async function getTransactionsByStatus(userId: string, status: TransactionStatus) {
  return prisma.transaction.findMany({
    where: {
      userId,
      status,
    },
    orderBy: { createdAt: "desc" },
  });
}

// 🔹 Get all transactions with optional filters
export async function getFilteredTransactions(
  userId: string,
  {
    type,
    status,
  }: {
    type?: TransactionType;
    status?: TransactionStatus;
  }
) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}
