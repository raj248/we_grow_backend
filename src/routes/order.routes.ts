import express from "express";
import { orderController } from "../controllers/order.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";

const router = express.Router();

router.get("/", cacheMiddleware(cacheKeys.orderList), orderController.getAll);
// router.get("/:id", orderController.getOne);
// router.delete("/:id", orderController.delete);

router.get(
  "/user/:userId",
  cacheMiddleware((req) => cacheKeys.orderInfo(req.params.userId)),
  orderController.getByUser
);
router.post("/", orderController.makeOrder);

router.get("/earn/:userId", orderController.getRandomVideo);
router.post("/reward", orderController.getReward);

export default router;
