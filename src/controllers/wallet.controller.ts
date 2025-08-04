import { Request, Response } from 'express';
import { WalletModel } from '~/models/wallet.model';

export const WalletController = {
  async getWallet(req: Request, res: Response) {
    const userId = req.params.userId;
    try {
      const wallet = await WalletModel.getWalletByUserId(userId);
      if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

      return res.json({ success: true, data: wallet });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch wallet', error });
    }
  },

  async updateWalletBalance(req: Request, res: Response) {
    const userId = req.params.userId;
    const { balance } = req.body;

    if (typeof balance !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid balance' });
    }

    try {
      const wallet = await WalletModel.updateBalance(userId, balance);
      return res.json({ success: true, data: wallet });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update balance', error });
    }
  },
};
