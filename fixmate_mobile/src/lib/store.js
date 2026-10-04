// Store details shared by the booking confirmation and Visit Store pages.
// Opening hours are NOT here: they come from the backend (/api/store/hours), which is their single source.

const API = import.meta.env.VITE_API_URL;

export const STORE_TZ = "Australia/Melbourne";

export const STORE = {
  name: "FixMate Mobile",
  addressLines: ["Eastland Shopping Centre", "175 Maroondah Hwy, Ringwood VIC 3134"],
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Eastland+Shopping+Centre+175+Maroondah+Hwy+Ringwood+VIC+3134",
  phone: "(03) 8820 8183",
  phoneHref: "tel:+61388208183",
};

// { timezone, weekly: [{ dayOfWeek, day, open, close, label }], upcoming: [{ date, label, closed, hoursLabel, note }] }
export async function fetchStoreHours() {
  const res = await fetch(`${API}/api/store/hours`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Could not load opening hours");
  return data;
}

// Current weekday (0 = Sunday), minutes after midnight and ISO date in Melbourne, whatever the browser's timezone
export function melbourneNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: STORE_TZ,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    dayOfWeek: days.indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function hhmmToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// "17:30" -> "5:30 pm"
export function hhmmToLabel(hhmm) {
  const mins = hhmmToMinutes(hhmm);
  if (mins == null) return "";
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

// Hours for a Melbourne date: a date override (holiday / special hours) wins over the weekly hours
export function hoursOn(hours, isoDate, dayOfWeek) {
  const override = hours.upcoming?.find((o) => o.date === isoDate);
  if (override) return { open: override.open, close: override.close, note: override.note };
  const w = hours.weekly?.[dayOfWeek];
  return { open: w?.open ?? null, close: w?.close ?? null, note: null };
}

// "Open until 5:30 pm" / "Closed • Opens Monday 9:00 am", computed in Melbourne time
export function storeStatus(hours, now = melbourneNow()) {
  const today = hoursOn(hours, now.isoDate, now.dayOfWeek);
  const open = hhmmToMinutes(today.open);
  const close = hhmmToMinutes(today.close);

  if (open != null && now.minutes >= open && now.minutes < close) {
    return { isOpen: true, text: `Open until ${hhmmToLabel(today.close)}` };
  }
  if (open != null && now.minutes < open) {
    return { isOpen: false, text: `Closed • Opens today ${hhmmToLabel(today.open)}` };
  }

  // next open day within a week (dates are walked in UTC so the arithmetic never hits DST)
  const base = new Date(`${now.isoDate}T00:00:00Z`);
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const h = hoursOn(hours, iso, d.getUTCDay());
    if (h.open) {
      return { isOpen: false, text: `Closed • Opens ${i === 1 ? "tomorrow" : names[d.getUTCDay()]} ${hhmmToLabel(h.open)}` };
    }
  }
  return { isOpen: false, text: "Closed" };
}

// "Apple iPhone" + "iPhone 17 Pro" -> "Apple iPhone 17 Pro"; "Samsung" + "Galaxy S24" -> "Samsung Galaxy S24"
export function deviceLabel(brand, model) {
  const b = String(brand || "").trim();
  const m = String(model || "").trim();
  if (!b) return m;
  const words = b.split(/\s+/);
  const last = words[words.length - 1];
  return m.toLowerCase().startsWith(last.toLowerCase()) ? [...words.slice(0, -1), m].join(" ") : `${b} ${m}`;
}
