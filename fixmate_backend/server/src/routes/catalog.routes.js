import express from "express";
import { compareModels } from "../modelOrder.js";
import { findPricingRows } from "../pricingRows.js";

export const catalogRouter = express.Router();

// Status of one repair for one model, derived from its Pricing row
export function repairStatus(row) {
  if (!row.available) return "NOT_AVAILABLE";
  if (row.price == null) return "QUOTE_ONLY";
  return "PRICED";
}

/**
 * GET /api/catalog
 * Returns:
 * {
 *   brands: ["Apple iPhone", ...],
 *   modelsByBrand: { "Apple iPhone": ["iPhone 17 Pro Max", ...], ... },   // iPhones newest first
 *   issuesByBrandModel: { "Apple iPhone||iPhone 17": ["Screen Replacement", ...], ... },
 *   issueStatusByBrandModel: { "Apple iPhone||iPhone 17": { "Battery Replacement": "QUOTE_ONLY", ... }, ... }
 * }
 * Status is one of PRICED | QUOTE_ONLY | NOT_AVAILABLE.
 */
catalogRouter.get("/", async (_req, res) => {
  const rows = await findPricingRows({
    select: { brand: true, model: true, issue: true, price: true, available: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }, { issue: "asc" }],
  });

  const brandsSet = new Set();
  const modelsByBrand = {};
  const issuesByBrandModel = {};
  const issueStatusByBrandModel = {};

  for (const r of rows) {
    brandsSet.add(r.brand);

    if (!modelsByBrand[r.brand]) modelsByBrand[r.brand] = new Set();
    modelsByBrand[r.brand].add(r.model);

    const key = `${r.brand}||${r.model}`;
    if (!issuesByBrandModel[key]) issuesByBrandModel[key] = new Set();
    issuesByBrandModel[key].add(r.issue);

    if (!issueStatusByBrandModel[key]) issueStatusByBrandModel[key] = {};
    issueStatusByBrandModel[key][r.issue] = repairStatus(r);
  }

  // convert Sets -> arrays
  const brands = [...brandsSet].sort();
  const modelsOut = {};
  for (const b of Object.keys(modelsByBrand)) {
    modelsOut[b] = [...modelsByBrand[b]].sort((x, y) => compareModels(b, x, y));
  }
  const issuesOut = {};
  for (const k of Object.keys(issuesByBrandModel)) {
    issuesOut[k] = [...issuesByBrandModel[k]].sort();
  }

  res.json({
    brands,
    modelsByBrand: modelsOut,
    issuesByBrandModel: issuesOut,
    issueStatusByBrandModel,
  });
});
