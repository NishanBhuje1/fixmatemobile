import express from "express";
import { STORE_TZ, nowInStore, storeDate, formatDay } from "../booking/time.js";
import { getAvailability } from "../booking/slots.js";
import { describeHours, getOverrides, getWeeklyHours } from "../booking/hours.js";

export const storeRouter = express.Router();
export const bookingRouter = express.Router();

// Express 4 does not catch errors from async handlers; pass them to the error middleware
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/**
 * GET /api/store/hours
 * Single source of opening hours for the site (Visit Store page, confirmation page).
 * { timezone, weekly: [{ dayOfWeek, day, open, close, label }], upcoming: [{ date, label, closed, open, close, hoursLabel, note }] }
 * `upcoming` lists date overrides (holidays / special hours) in the next 60 days.
 */
storeRouter.get("/hours", wrap(async (_req, res) => {
  const today = nowInStore().startOf("day");
  const until = today.plus({ days: 60 });

  const [weekly, overrides] = await Promise.all([
    getWeeklyHours(),
    getOverrides(today.toISODate(), until.toISODate()),
  ]);

  res.json({
    timezone: STORE_TZ,
    weekly: weekly.map((w) => ({ dayOfWeek: w.dayOfWeek, day: w.day, ...describeHours(w) })),
    upcoming: [...overrides.values()].map((o) => {
      const iso = o.date.toISOString().slice(0, 10);
      const hours = describeHours(o.openMinute != null && o.closeMinute != null ? o : {});
      return {
        date: iso,
        label: formatDay(storeDate(iso)),
        closed: hours.open == null,
        open: hours.open,
        close: hours.close,
        hoursLabel: hours.label,
        note: o.note,
      };
    }),
  });
}));

/**
 * GET /api/booking/availability
 * Bookable days (today + 13) with 30-minute slots; full slots have available: false.
 */
bookingRouter.get("/availability", wrap(async (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await getAvailability());
}));
