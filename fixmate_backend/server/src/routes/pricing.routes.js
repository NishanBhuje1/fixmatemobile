import express from "express";
import { prisma } from "../prisma.js";

export const pricingRouter = express.Router();

/**
 * GET /api/pricing?brand=...&model=...&issue=...
 * Returns { price } in cents
 */
pricingRouter.get("/", async (req, res) => {
  const brand = String(req.query.brand || "");
  const model = String(req.query.model || "");
  const issue = String(req.query.issue || "");

  if (!brand || !model || !issue) {
    return res.status(400).json({ error: "brand, model, issue are required" });
  }

  const rule = await prisma.pricing.findUnique({
    where: { brand_model_issue: { brand, model, issue } },
  });

  if (!rule) return res.status(404).json({ error: "No price found" });

  res.json({ price: rule.price }); // cents
});

