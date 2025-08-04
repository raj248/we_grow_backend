import express from 'express';
import { WalletController } from '~/controllers/wallet.controller';

const router = express.Router();

router.get('/:userId', WalletController.getWallet);
router.patch('/:userId', WalletController.updateWalletBalance);

export default router;
