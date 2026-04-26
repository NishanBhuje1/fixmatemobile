import express from "express";
import { prisma } from "../prisma.js";

export const catalogRouter = express.Router();

/**
 * GET /api/catalog
 * Returns:
 * {
 *   brands: ["Apple", ...],
 *   modelsByBrand: { Apple: ["iPhone 15", ...], ... },
 *   issuesByBrandModel: { "Apple||iPhone 15": ["Screen Replacement", ...], ... }
 * }
 */
catalogRouter.get("/", async (_req, res) => {
  const rows = await prisma.pricing.findMany({
    select: { brand: true, model: true, issue: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }, { issue: "asc" }],
  });

  const brandsSet = new Set();
  const modelsByBrand = {};
  const issuesByBrandModel = {};

  for (const r of rows) {
    brandsSet.add(r.brand);

    if (!modelsByBrand[r.brand]) modelsByBrand[r.brand] = new Set();
    modelsByBrand[r.brand].add(r.model);

    const key = `${r.brand}||${r.model}`;
    if (!issuesByBrandModel[key]) issuesByBrandModel[key] = new Set();
    issuesByBrandModel[key].add(r.issue);
  }

  // convert Sets -> arrays
  const brands = [...brandsSet].sort();
  const modelsOut = {};
  for (const b of Object.keys(modelsByBrand)) {
    modelsOut[b] = [...modelsByBrand[b]].sort();
  }
  const issuesOut = {};
  for (const k of Object.keys(issuesByBrandModel)) {
    issuesOut[k] = [...issuesByBrandModel[k]].sort();
  }

  res.json({ brands, modelsByBrand: modelsOut, issuesByBrandModel: issuesOut });
});
