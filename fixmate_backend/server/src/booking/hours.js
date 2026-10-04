import { prisma } from "../prisma.js";
import { dayOfWeek, minutesToHHMM, minutesToLabel } from "./time.js";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// @db.Date columns are compared as UTC midnight of the calendar date
export function dbDate(isoDate) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function isOpen(h) {
  return h && h.openMinute != null && h.closeMinute != null && h.openMinute < h.closeMinute;
}

export async function getWeeklyHours() {
  const rows = await prisma.storeHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  return DAY_NAMES.map((name, i) => {
    const r = byDay.get(i);
    return {
      dayOfWeek: i,
      day: name,
      openMinute: isOpen(r) ? r.openMinute : null,
      closeMinute: isOpen(r) ? r.closeMinute : null,
    };
  });
}

// Overrides keyed by "YYYY-MM-DD" for [fromIso, toIso]
export async function getOverrides(fromIso, toIso) {
  const rows = await prisma.storeDateOverride.findMany({
    where: { date: { gte: dbDate(fromIso), lte: dbDate(toIso) } },
    orderBy: { date: "asc" },
  });
  return new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r]));
}

// Opening hours for one Melbourne day: { openMinute, closeMinute, note } or { closed: true, note }
export function hoursForDay(day, weekly, overrides) {
  const override = overrides.get(day.toISODate());
  if (override) {
    return isOpen(override)
      ? { openMinute: override.openMinute, closeMinute: override.closeMinute, note: override.note }
      : { closed: true, note: override.note };
  }
  const w = weekly[dayOfWeek(day)];
  return isOpen(w) ? { openMinute: w.openMinute, closeMinute: w.closeMinute, note: null } : { closed: true, note: null };
}

export function describeHours(h) {
  return {
    open: minutesToHHMM(h.openMinute),
    close: minutesToHHMM(h.closeMinute),
    label: h.openMinute == null ? "Closed" : `${minutesToLabel(h.openMinute)} – ${minutesToLabel(h.closeMinute)}`,
  };
}
