import express from "express";
import * as TransactionController from "~/controllers/transaction.controller";

const router = express.Router();

// All transactions for user (optionally filtered by type/status)
router.get("/user/:id", TransactionController.getUserTransactions);

// Filtered by type only
router.get("/user/:id/type", TransactionController.getUserTransactionsByType);

// Filtered by status only
router.get("/user/:id/status", TransactionController.getUserTransactionsByStatus);

export default router;
