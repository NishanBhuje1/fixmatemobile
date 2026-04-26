import express from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";

export const adminRouter = express.Router();
adminRouter.use(requireAdmin);

// List all pricing
adminRouter.get("/pricing", async (_req, res) => {
  const rules = await prisma.pricing.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }, { issue: "asc" }],
  });
  res.json({ rules });
});

// Upsert fixed price (cents)
// PUT /api/admin/pricing  { brand, model, issue, price }  // price in cents
adminRouter.put("/pricing", async (req, res) => {
  const brand = String(req.body?.brand || "").trim();
  const model = String(req.body?.model || "").trim();
  const issue = String(req.body?.issue || "").trim();
  const price = Number(req.body?.price);

  if (!brand || !model || !issue) return res.status(400).json({ error: "brand, model, issue are required" });
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "price must be > 0 (cents)" });

  const rule = await prisma.pricing.upsert({
    where: { brand_model_issue: { brand, model, issue } },
    update: { price },
    create: { brand, model, issue, price },
  });

  res.json({ rule });
});

// GET /api/admin/pricing
adminRouter.get("/pricing", async (_req, res) => {
  const rules = await prisma.pricing.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }, { issue: "asc" }],
  });
  res.json({ rules });
});

// DELETE /api/admin/pricing?brand=..&model=..&issue=..
adminRouter.delete("/pricing", async (req, res) => {
  const brand = String(req.query.brand || "").trim();
  const model = String(req.query.model || "").trim();
  const issue = String(req.query.issue || "").trim();
  if (!brand || !model || !issue) return res.status(400).json({ error: "brand, model, issue are required" });

  await prisma.pricing.delete({ where: { brand_model_issue: { brand, model, issue } } });
  res.json({ ok: true });
});