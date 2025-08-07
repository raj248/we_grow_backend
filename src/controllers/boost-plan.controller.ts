import { Request, Response } from "express";
import * as BoostPlanModel from "../models/boost-plan.model.js";
import { PlanType } from "@prisma/client";

export const getAllBoostPlans = async (req: Request, res: Response) => {
  try {
    const plans = await BoostPlanModel.getAllBoostPlans();
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching boost plans", error: err });
  }
};

export const getBoostPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await BoostPlanModel.getBoostPlanById(id);

    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching plan", error: err });
  }
};

export const getBoostPlansByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    if (!type || !["VIEW", "LIKE"].includes(type as string)) {
      return res.status(400).json({ success: false, message: "Invalid or missing type" });
    }

    const plans = await BoostPlanModel.getBoostPlansByType(type as PlanType);
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching plans", error: err });
  }
};

export const createBoostPlan = async (req: Request, res: Response) => {
  try {
    const { title, description, price, type, views = 0, likes = 0, isActive = true } = req.body;

    if (!title || !type || !price) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const plan = await BoostPlanModel.createBoostPlan({ title, description, price, type, views, likes, isActive });

    return res.status(201).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error creating plan", error: err });
  }
};

export const updateBoostPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await BoostPlanModel.updateBoostPlan(id, updates);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error updating plan", error: err });
  }
};

export const deactivateBoostPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await BoostPlanModel.deactivateBoostPlan(id);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error deactivating plan", error: err });
  }
};

export const activateBoostPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await BoostPlanModel.activateBoostPlan(id);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error activating plan", error: err });
  }
};
