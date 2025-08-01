import { Request, Response } from 'express';
import { UserModel } from '~/models/user.model';
import { logger } from '~/utils/log';

export const UserController = {
  async registerGuest(req: Request, res: Response): Promise<void> {
    const { guestId, fcmToken } = req.body;

    if (!guestId || guestId.length !== 8) {
      res.status(400).json({ success: false, error: 'Invalid or missing guestId' });
      return;
    }

    const result = await UserModel.upsertGuest(guestId, fcmToken);

    if (!result.success) {
      logger.error(`UserController.registerGuest: ${result.error}`);
      res.status(500).json(result);
      return;
    }

    res.status(201).json(result);
  },

  async updateFcmToken(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid fcmToken' });
      return;
    }

    const result = await UserModel.updateFcmToken(id, fcmToken);

    if (!result.success) {
      logger.error(`UserController.updateFcmToken: ${result.error}`);
      res.status(500).json(result);
      return;
    }

    res.json(result);
  }
};
