import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { env } from "../env.js";

export const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { role: "admin", username: user.username, uid: user.id },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});
