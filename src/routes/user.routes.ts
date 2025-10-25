import express from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", UserController.getAll);
router.get("/active", verifyAdmin, UserController.getActiveUsersLast24Hrs);
router.get("/:id", UserController.getById);
router.post("/", UserController.registerUser);
router.patch("/:id/fcm", UserController.updateFcmToken);
router.patch("/:id/last-active", UserController.updateLastActive); // 👈 NEW ROUTE

export default router;
