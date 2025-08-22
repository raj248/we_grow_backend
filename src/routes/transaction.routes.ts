import express from "express";
import * as TransactionController from "../controllers/transaction.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";

const router = express.Router();
// Get all transactions
router.get("/", TransactionController.getAllTransactions);
// All transactions for user (optionally filtered by type/status)
router.get(
  "/user/:id",
  cacheMiddleware((req) => cacheKeys.transactionInfo(req.params.id)),
  TransactionController.getUserTransactions
);

// Filtered by type only
router.get("/user/:id/type", TransactionController.getUserTransactionsByType);

// Filtered by status only
router.get(
  "/user/:id/status",
  TransactionController.getUserTransactionsByStatus
);

export default router;
