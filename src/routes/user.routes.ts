import express from 'express';
import { UserController } from '~/controllers/user.controller';

const router = express.Router();

// POST /users/guest - register or update guest
router.post('/guest', UserController.registerGuest);

// PUT /users/:id/fcm-token - update FCM token
router.put('/:id/fcm-token', UserController.updateFcmToken);

export default router;
