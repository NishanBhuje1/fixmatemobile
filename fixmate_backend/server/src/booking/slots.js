import { DateTime } from "luxon";
import { prisma } from "../prisma.js";
import {
  BOOKING_WINDOW_DAYS,
  MIN_NOTICE_MINUTES,
  SLOT_CAPACITY,
  SLOT_MINUTES,
  STORE_TZ,
  atMinute,
  formatDay,
  nowInStore,
} from "./time.js";
import { getOverrides, getWeeklyHours, hoursForDay } from "./hours.js";

// Bookings that still hold a place in their slot
export const ACTIVE_BOOKING = { status: { not: "CANCELLED" } };

// Slot start times for one day. Last slot starts SLOT_MINUTES before closing;
// past slots and slots inside the minimum-notice window are left out entirely.
function slotStartsForDay(day, hours, now) {
  if (hours.closed) return [];
  const earliest = now.plus({ minutes: MIN_NOTICE_MINUTES });
  const starts = [];
  for (let m = hours.openMinute; m + SLOT_MINUTES <= hours.closeMinute; m += SLOT_MINUTES) {
    const start = atMinute(day, m);
    if (start >= earliest) starts.push(start);
  }
  return starts;
}

function windowDays(now) {
  const today = now.startOf("day");
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => today.plus({ days: i }));
}

/**
 * Every bookable day in the window with its slots. Full slots are included with available: false.
 * { timezone, days: [{ date, label, closed, note, slots: [{ start, label, remaining, available }] }] }
 */
export async function getAvailability(now = nowInStore()) {
  const days = windowDays(now);
  const first = days[0];
  const last = days[days.length - 1];

  const [weekly, overrides, counts] = await Promise.all([
    getWeeklyHours(),
    getOverrides(first.toISODate(), last.toISODate()),
    prisma.lead.groupBy({
      by: ["slotStart"],
      where: {
        ...ACTIVE_BOOKING,
        slotStart: { gte: first.toJSDate(), lt: last.plus({ days: 1 }).toJSDate() },
      },
      _count: { _all: true },
    }),
  ]);

  const taken = new Map(counts.map((c) => [c.slotStart.getTime(), c._count._all]));

  return {
    timezone: STORE_TZ,
    slotMinutes: SLOT_MINUTES,
    days: days.map((day) => {
      const hours = hoursForDay(day, weekly, overrides);
      const slots = slotStartsForDay(day, hours, now).map((start) => {
        const remaining = Math.max(0, SLOT_CAPACITY - (taken.get(start.toMillis()) || 0));
        return {
          start: start.toUTC().toISO(),
          label: start.toFormat("h:mm a"),
          remaining,
          available: remaining > 0,
        };
      });
      return {
        date: day.toISODate(),
        label: formatDay(day),
        closed: Boolean(hours.closed),
        note: hours.note || null,
        slots,
      };
    }),
  };
}

/**
 * Checks that an ISO timestamp is a real, currently bookable slot (ignores capacity).
 * Returns the slot start as a JS Date, or null.
 */
export async function resolveBookableSlot(startIso, now = nowInStore()) {
  const start = DateTime.fromISO(String(startIso || ""), { setZone: true });
  if (!start.isValid) return null;

  const local = start.setZone(STORE_TZ);
  const day = local.startOf("day");
  const days = windowDays(now);
  if (day < days[0] || day > days[days.length - 1]) return null;

  const [weekly, overrides] = await Promise.all([
    getWeeklyHours(),
    getOverrides(day.toISODate(), day.toISODate()),
  ]);
  const match = slotStartsForDay(day, hoursForDay(day, weekly, overrides), now).find(
    (s) => s.toMillis() === local.toMillis()
  );
  return match ? match.toJSDate() : null;
}
