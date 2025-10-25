import express from "express";
import { orderController } from "../controllers/order.controller.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { refreshOrderWorker } from "../utils/worker.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  verifyAdmin,
  cacheMiddleware(cacheKeys.orderList),
  orderController.getAll
);
router.get("/:id", orderController.getById);
// router.delete("/:id", orderController.delete);

router.get(
  "/user/:userId",
  cacheMiddleware((req) => cacheKeys.orderInfo(req.params.userId)),
  orderController.getByUser
);
router.post("/", orderController.makeOrder);

// router.patch("/status/:id", orderController.updateOrderStatus);
// router.patch(
//   "/progress/view/:id",
//   orderController.updateOrderProgressViewCount
// );
// router.patch(
//   "/progress/like/:id",
//   orderController.updateOrderProgressLikeCount
// );
// router.patch(
//   "/progress/subscriber/:id",
//   orderController.updateOrderProgressSubscriberCount
// );
router.delete("/:id", verifyAdmin, orderController.deleteOrder);

router.get("/earn/:userId", orderController.getRandomVideo);
router.post("/reward", orderController.getReward);

// router.post("/refresh-order/:id", verifyAdmin, async (req, res) => {
//   const { id } = req.params;
//   try {
//     const result = await refreshOrderWorker(id);
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });
export default router;
