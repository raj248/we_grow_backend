import express from "express";
import { boostPlanController } from "../controllers/boost-plan.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";

const router = express.Router();

// GET all active boost plans (optionally filter by type)
router.get("/", cacheMiddleware(cacheKeys.planList), boostPlanController.list);

// GET a specific plan by ID
router.get(
  "/:id",
  cacheMiddleware((req) => cacheKeys.planInfo(req.params.id)),
  boostPlanController.getById
);

// POST a new plan
router.post("/", boostPlanController.create);

// PATCH update a plan by ID
router.put("/:id", boostPlanController.update);

// PATCH deactivate a plan by ID
router.patch("/deactivate/:id", boostPlanController.deactivate);

// PATCH activate a plan by ID
router.patch("/activate/:id", boostPlanController.activate);

export default router;
