import { STORE, deviceLabel } from "./store";

// The confirmed booking is kept for this browser tab so the confirmation page survives a refresh.
// It is only ever written after the API has returned success.
const KEY = "fixmate_last_booking_v1";
const SLOT_MINUTES = 30;

export function saveConfirmedBooking(booking) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(booking));
  } catch {
    // storage unavailable (private mode etc.): the page falls back to a generic confirmation
  }
}

export function loadConfirmedBooking() {
  try {
    const b = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return b && typeof b.reference === "string" ? b : null;
  } catch {
    return null;
  }
}

function icsDate(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261009T033000Z
}

function icsText(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// .ics for the booked slot. Times are UTC instants, so calendar apps show them in the user's own timezone correctly.
export function buildIcs(booking) {
  const start = new Date(booking.slotStart);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
  const device = deviceLabel(booking.brand, booking.model);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FixMate Mobile//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@fixmatemobile.com`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`FixMate repair: ${device}`)}`,
    `LOCATION:${icsText(`${STORE.name}, ${STORE.addressLines.join(", ")}`)}`,
    `DESCRIPTION:${icsText(
      `Booking reference: ${booking.reference}\n${booking.issue}\nBring your device and passcode.\nPhone: ${STORE.phone}`
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(booking) {
  const blob = new Blob([buildIcs(booking)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fixmate-booking-${booking.reference}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
