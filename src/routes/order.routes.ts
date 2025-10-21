import express from "express";
import { orderController } from "../controllers/order.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";

const router = express.Router();

router.get("/", cacheMiddleware(cacheKeys.orderList), orderController.getAll);
router.get("/:id", orderController.getById);
// router.delete("/:id", orderController.delete);

router.get(
  "/user/:userId",
  cacheMiddleware((req) => cacheKeys.orderInfo(req.params.userId)),
  orderController.getByUser
);
router.post("/", orderController.makeOrder);

router.patch("/status/:id", orderController.updateOrderStatus);
router.patch(
  "/progress/view/:id",
  orderController.updateOrderProgressViewCount
);
router.patch(
  "/progress/like/:id",
  orderController.updateOrderProgressLikeCount
);
router.patch(
  "/progress/subscriber/:id",
  orderController.updateOrderProgressSubscriberCount
);
router.delete("/:id", orderController.deleteOrder);

router.get("/earn/:userId", orderController.getRandomVideo);
router.post("/reward", orderController.getReward);

export default router;
