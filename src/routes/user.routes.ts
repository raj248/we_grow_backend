import express from 'express';
import { UserController } from '~/controllers/user.controller';

const router = express.Router();

router.post('/', UserController.registerUser);
router.patch('/:id/fcm', UserController.updateFcmToken);
router.patch('/:id/last-active', UserController.updateLastActive); // 👈 NEW ROUTE
router.get("/active", UserController.getActiveUsersLast24Hrs);
export default router;
