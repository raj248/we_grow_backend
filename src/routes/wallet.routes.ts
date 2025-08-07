import express from 'express';
import { purchaseCoins } from '../controllers/purchase-coin.controller.js';
import { WalletController } from '../controllers/wallet.controller.js';

const router = express.Router();

router.get('/:userId', WalletController.getWallet);
router.patch('/:userId', WalletController.updateWalletBalance);
router.post("/topup", purchaseCoins);

export default router;
