import express from "express";
import { mainController } from "../controllers/main.controller.js";

const router = express.Router();

router.get("/", mainController.list);
export default router;
