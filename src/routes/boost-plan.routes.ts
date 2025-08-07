import express from "express";
import * as BoostPlanController from "../controllers/boost-plan.controller.js";

const router = express.Router();

// GET all active boost plans (optionally filter by type)
router.get("/", BoostPlanController.getAllBoostPlans);

// GET a specific plan by ID
router.get("/:id", BoostPlanController.getBoostPlanById);

// POST a new plan
router.post("/", BoostPlanController.createBoostPlan);

// PATCH update a plan by ID
router.patch("/:id", BoostPlanController.updateBoostPlan);

// DELETE a plan by ID
router.delete("/:id", BoostPlanController.deactivateBoostPlan);

export default router;
