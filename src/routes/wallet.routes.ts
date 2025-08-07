import express from 'express';
import { topupCoins } from '../controllers/topup-coin.controller.js';
import { WalletController } from '../controllers/wallet.controller.js';

const router = express.Router();

router.get('/:userId', WalletController.getWallet);
router.patch('/:userId', WalletController.updateWalletBalance);
router.post("/topup", topupCoins);

export default router;
