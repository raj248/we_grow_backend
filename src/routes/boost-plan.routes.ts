import express from "express";
import { boostPlanController } from "../controllers/boost-plan.controller.js";

const router = express.Router();

// GET all active boost plans (optionally filter by type)
router.get("/", boostPlanController.list);

// GET a specific plan by ID
router.get("/:id", boostPlanController.getById);

// POST a new plan
router.post("/", boostPlanController.create);

// PATCH update a plan by ID
router.patch("/:id", boostPlanController.update);

// 
// GET plans by type
router.get("/type", boostPlanController.getByType);

// PATCH deactivate a plan by ID
router.patch("/deactivate/:id", boostPlanController.deactivate);

// PATCH activate a plan by ID
router.patch("/activate/:id", boostPlanController.activate);

export default router;
