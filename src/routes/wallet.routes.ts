import express from "express";
import { WalletController } from "../controllers/wallet.controller.js";

const router = express.Router();

router.get("/:userId", WalletController.getWallet);
// router.patch("/:userId", WalletController.updateWalletBalance);
// router.post("/topup", topupCoins); @deprecated
// router.post("/order", orderController.makeOrder);
// router.get("/earn/:userId", orderController.getRandomVideo)
// router.post("/reward", orderController.getReward)

export default router;
