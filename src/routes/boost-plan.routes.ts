import express from "express";
import { boostPlanController } from "../controllers/boost-plan.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

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
router.post("/", verifyAdmin, boostPlanController.create);

// PATCH update a plan by ID
router.put("/:id", verifyAdmin, boostPlanController.update);

// PATCH deactivate a plan by ID
router.patch("/deactivate/:id", verifyAdmin, boostPlanController.deactivate);

// PATCH activate a plan by ID
router.patch("/activate/:id", verifyAdmin, boostPlanController.activate);

// DELETE a plan by ID
router.delete("/:id", verifyAdmin, boostPlanController.delete);

export default router;
