import { Request, Response } from "express";
import * as TransactionModel from "../models/transaction.model.js";
import { TransactionStatus, TransactionType } from "@prisma/client";

export const getUserTransactions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, status } = req.query;

  try {
    const transactions = await TransactionModel.getAllTransactionsByUserId(id);

    if (!transactions) return res.status(404).json({ success: false, error: "Transactions not found" });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const getUserTransactionsByType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type } = req.query;

  if (!type) return res.status(400).json({ error: "Type is required" });

  try {
    const transactions = await TransactionModel.getTransactionsByType(id, type as TransactionType);
    if (!transactions) return res.status(404).json({ success: false, error: "Transactions not found" });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Failed to fetch by type:", error);
    res.status(500).json({ error: "Failed to fetch by type" });
  }
};

export const getUserTransactionsByStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.query;

  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    const transactions = await TransactionModel.getTransactionsByStatus(id, status as TransactionStatus);
    if (!transactions) return res.status(404).json({ success: false, error: "Transactions not found" });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Failed to fetch by status:", error);
    res.status(500).json({ error: "Failed to fetch by status" });
  }
};
