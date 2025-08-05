import express from 'express';
import { purchaseCoins } from '~/controllers/purchase-coin.controller';
import { WalletController } from '~/controllers/wallet.controller';

const router = express.Router();

router.get('/:userId', WalletController.getWallet);
router.patch('/:userId', WalletController.updateWalletBalance);
router.post("/purchase", purchaseCoins);

export default router;
