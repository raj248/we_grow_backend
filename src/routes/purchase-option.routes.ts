import express from 'express';
import { PurchaseOptionController } from '../controllers/purchase-option.controller.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { cacheKeys } from '../utils/cacheKeys.js';

const router = express.Router();

// GET /api/purchase-options - get all purchase options
router.get('/', cacheMiddleware(() => cacheKeys.purchaseOptionList()), PurchaseOptionController.getAll);

// GET /api/purchase-options/:id - get a specific purchase option by ID
router.get('/:id', cacheMiddleware((req) => cacheKeys.purchaseOptionInfo(req.params.id)), PurchaseOptionController.getById);

// POST /api/purchase-options - create a new purchase option
router.post('/', PurchaseOptionController.create);

// PATCH /api/purchase-options/:id - update a specific purchase option
router.patch('/:id', PurchaseOptionController.update);

// DELETE /api/purchase-options/:id - delete a specific purchase option
router.delete('/:id', PurchaseOptionController.delete);

export default router;
