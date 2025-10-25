import express from "express";
import { TopupController } from "../controllers/topup.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/topup-options - get all purchase options
router.get(
  "/",
  cacheMiddleware(() => cacheKeys.TopupOptionList()),
  TopupController.getAll
);

// GET /api/topup-options/:id - get a specific purchase option by ID
router.get(
  "/:id",
  cacheMiddleware((req) => cacheKeys.purchaseOptionInfo(req.params.id)),
  TopupController.getById
);

// POST /api/topup-options/validate-receipt
router.post("/validate-receipt", TopupController.validateReceipt);
// POST /api/topup-options - create a new purchase option
router.post("/", verifyAdmin, TopupController.create);

// PATCH /api/topup-options/:id - update a specific purchase option
router.put("/:id", verifyAdmin, TopupController.update);

// DELETE /api/topup-options/:id - delete a specific purchase option
router.delete("/:id", verifyAdmin, TopupController.delete);

export default router;
