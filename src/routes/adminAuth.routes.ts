import express from "express";
import { comparePassword, generateToken } from "../utils/auth.js";
import * as cookie from "cookie";
import { verifyAdmin } from "../middleware/auth.middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required" });
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !(await comparePassword(password, admin.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(admin.id);

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("admin_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
  );

  return res.json({ success: true });
});

// -------------------- CHECK ADMIN SESSION --------------------
router.get("/check", verifyAdmin, (req, res) => {
  return res.json({ success: true, data: { isAdmin: true } });
});

// -------------------- LOGOUT --------------------
router.post("/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("admin_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0), // expire immediately
    })
  );

  return res.json({ success: true });
});

export default router;
