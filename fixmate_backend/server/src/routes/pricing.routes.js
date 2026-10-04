import express from "express";
import { findPricingRows } from "../pricingRows.js";
import { repairStatus } from "./catalog.routes.js";

export const pricingRouter = express.Router();

/**
 * GET /api/pricing?brand=...&model=...&issue=...
 * Priced repair: 200 { price, status: "PRICED" }  (price in cents)
 * Quote only / not available: 404 { error, price: null, status: "QUOTE_ONLY" | "NOT_AVAILABLE" }
 *   Non-2xx on purpose: older frontends read any 200 body as a price and would show $0.00.
 */
pricingRouter.get("/", async (req, res) => {
  const brand = String(req.query.brand || "");
  const model = String(req.query.model || "");
  const issue = String(req.query.issue || "");

  if (!brand || !model || !issue) {
    return res.status(400).json({ error: "brand, model, issue are required" });
  }

  const [rule] = await findPricingRows({
    where: { brand, model, issue },
    select: { price: true, available: true },
    take: 1,
  });

  if (!rule) return res.status(404).json({ error: "No price found" });

  const status = repairStatus(rule);
  if (status === "QUOTE_ONLY") {
    return res.status(404).json({
      error: "No fixed price for this repair. Please contact us for a quote.",
      price: null,
      status,
    });
  }
  if (status === "NOT_AVAILABLE") {
    return res.status(404).json({
      error: "This repair is not available for this model.",
      price: null,
      status,
    });
  }

  res.json({ price: rule.price, status }); // cents
});
