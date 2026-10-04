import express from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { compareModels } from "../modelOrder.js";
import { dbDate, getWeeklyHours } from "../booking/hours.js";
import { nowInStore } from "../booking/time.js";

export const adminRouter = express.Router();
adminRouter.use(requireAdmin);

// List all pricing (iPhones newest first, same order as the public catalog)
adminRouter.get("/pricing", async (_req, res) => {
  const rules = await prisma.pricing.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }, { issue: "asc" }],
  });
  rules.sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      compareModels(a.brand, a.model, b.model) ||
      a.issue.localeCompare(b.issue)
  );
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
    update: { price, available: true }, // setting a price makes the repair bookable again
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
// ---------- Opening hours (Australia/Melbourne local time, minutes after midnight) ----------

// Express 4 does not catch errors from async handlers; pass them to the error middleware
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// { openMinute, closeMinute } from the body; both null = closed. Returns an error string or the hours.
function parseHours(body) {
  const open = body?.openMinute;
  const close = body?.closeMinute;
  if (open == null && close == null) return { openMinute: null, closeMinute: null };

  const valid = (m) => Number.isInteger(m) && m >= 0 && m <= 24 * 60;
  if (!valid(open) || !valid(close)) return "openMinute and closeMinute must be whole minutes between 0 and 1440";
  if (open >= close) return "Closing time must be after opening time";
  return { openMinute: open, closeMinute: close };
}

// GET /api/admin/store-hours -> { weekly, overrides } (overrides from today onwards)
adminRouter.get("/store-hours", wrap(async (_req, res) => {
  const today = nowInStore().toISODate();
  const [weekly, overrides] = await Promise.all([
    getWeeklyHours(),
    prisma.storeDateOverride.findMany({ where: { date: { gte: dbDate(today) } }, orderBy: { date: "asc" } }),
  ]);
  res.json({
    weekly,
    overrides: overrides.map((o) => ({ ...o, date: o.date.toISOString().slice(0, 10) })),
  });
}));

// PUT /api/admin/store-hours/:dayOfWeek  { openMinute, closeMinute }  (0 = Sunday)
adminRouter.put("/store-hours/:dayOfWeek", wrap(async (req, res) => {
  const dayOfWeek = Number(req.params.dayOfWeek);
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return res.status(400).json({ error: "dayOfWeek must be 0 (Sunday) to 6 (Saturday)" });
  }
  const hours = parseHours(req.body);
  if (typeof hours === "string") return res.status(400).json({ error: hours });

  const row = await prisma.storeHours.upsert({
    where: { dayOfWeek },
    update: hours,
    create: { dayOfWeek, ...hours },
  });
  res.json({ row });
}));

// PUT /api/admin/store-overrides/:date  { openMinute, closeMinute, note }  (both null = closed all day)
adminRouter.put("/store-overrides/:date", wrap(async (req, res) => {
  const date = String(req.params.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dbDate(date).getTime())) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  const hours = parseHours(req.body);
  if (typeof hours === "string") return res.status(400).json({ error: hours });
  const note = req.body?.note ? String(req.body.note).trim().slice(0, 100) : null;

  const row = await prisma.storeDateOverride.upsert({
    where: { date: dbDate(date) },
    update: { ...hours, note },
    create: { date: dbDate(date), ...hours, note },
  });
  res.json({ row: { ...row, date } });
}));

// DELETE /api/admin/store-overrides/:date
adminRouter.delete("/store-overrides/:date", wrap(async (req, res) => {
  const date = String(req.params.date);
  await prisma.storeDateOverride.deleteMany({ where: { date: dbDate(date) } });
  res.json({ ok: true });
}));
