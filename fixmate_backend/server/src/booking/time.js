import { DateTime } from "luxon";

// All booking logic runs in the store's timezone, never the server's or the browser's.
export const STORE_TZ = "Australia/Melbourne";
export const LOCALE = "en-AU";

export const SLOT_MINUTES = 30;
export const SLOT_CAPACITY = 2; // max bookings per slot
export const MIN_NOTICE_MINUTES = 60; // today's slots must start at least this far from now
export const BOOKING_WINDOW_DAYS = 14; // today + 13 days

export function nowInStore() {
  return DateTime.now().setZone(STORE_TZ).setLocale(LOCALE);
}

// "2026-10-09" -> DateTime at the start of that Melbourne day
export function storeDate(isoDate) {
  return DateTime.fromISO(isoDate, { zone: STORE_TZ }).setLocale(LOCALE).startOf("day");
}

// Wall-clock time on a Melbourne date (built from parts, so DST days are correct)
export function atMinute(day, minuteOfDay) {
  return DateTime.fromObject(
    {
      year: day.year,
      month: day.month,
      day: day.day,
      hour: Math.floor(minuteOfDay / 60),
      minute: minuteOfDay % 60,
    },
    { zone: STORE_TZ }
  ).setLocale(LOCALE);
}

// Luxon weekday is 1 = Monday … 7 = Sunday; StoreHours uses 0 = Sunday … 6 = Saturday
export function dayOfWeek(day) {
  return day.weekday % 7;
}

// Melbourne calendar date of an instant: "2026-10-09" (not the UTC date, which differs before 10/11 am)
export function storeDateOf(date) {
  return DateTime.fromJSDate(new Date(date)).setZone(STORE_TZ).toISODate();
}

// "Fri 9 Oct, 2:30 pm"
export function formatSlot(date) {
  return DateTime.fromJSDate(new Date(date)).setZone(STORE_TZ).setLocale(LOCALE).toFormat("ccc d LLL, h:mm a");
}

// "2:30 pm"
export function formatSlotTime(date) {
  return DateTime.fromJSDate(new Date(date)).setZone(STORE_TZ).setLocale(LOCALE).toFormat("h:mm a");
}

// "Fri 9 Oct"
export function formatDay(day) {
  return day.setLocale(LOCALE).toFormat("ccc d LLL");
}

// Human-readable booking time for any lead, new (slotStart) or legacy (date + Morning/Afternoon/Evening)
export function bookingTimeLabel(lead) {
  if (lead.slotStart) return formatSlot(lead.slotStart);

  // Legacy rows store the chosen calendar day as midnight UTC, so read the date back in UTC
  const day = lead.preferredDate
    ? DateTime.fromJSDate(new Date(lead.preferredDate), { zone: "UTC" }).setLocale(LOCALE).toFormat("ccc d LLL")
    : "";
  return [day, lead.preferredTime].filter(Boolean).join(", ");
}

export function minutesToHHMM(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// 1050 -> "5:30 pm"
export function minutesToLabel(m) {
  if (m == null) return null;
  return DateTime.fromObject({ hour: Math.floor(m / 60) % 24, minute: m % 60 })
    .setLocale(LOCALE)
    .toFormat("h:mm a");
}
