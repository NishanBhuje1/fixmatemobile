import { prisma } from "./prisma.js";

// prisma.pricing.findMany, but still works before migration 20261003000100_pricing_availability
// has been applied (no "available" column yet): rows are then treated as available.
// This lets the new code be deployed before or after the migration.
// TODO: remove the fallback once that migration is live in production.
export async function findPricingRows(args) {
  try {
    return await prisma.pricing.findMany(args);
  } catch (e) {
    if (e?.code !== "P2022") throw e; // P2022 = column does not exist

    const { available: _available, ...select } = args.select;
    const rows = await prisma.pricing.findMany({ ...args, select });
    return rows.map((r) => ({ ...r, available: true }));
  }
}
