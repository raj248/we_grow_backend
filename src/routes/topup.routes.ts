import express from 'express';
import { TopupController } from '../controllers/topup.controller.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { cacheKeys } from '../utils/cacheKeys.js';

const router = express.Router();

// GET /api/purchase-options - get all purchase options
router.get('/', cacheMiddleware(() => cacheKeys.TopupOptionList()), TopupController.getAll);

// GET /api/purchase-options/:id - get a specific purchase option by ID
router.get('/:id', cacheMiddleware((req) => cacheKeys.purchaseOptionInfo(req.params.id)), TopupController.getById);

// POST /api/purchase-options - create a new purchase option
router.post('/', TopupController.create);

// PATCH /api/purchase-options/:id - update a specific purchase option
router.patch('/:id', TopupController.update);

// DELETE /api/purchase-options/:id - delete a specific purchase option
router.delete('/:id', TopupController.delete);

export default router;
