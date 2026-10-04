import { useEffect, useState } from "react";
import { melbourneNow } from "../lib/store";

// Opening hours editor for the admin dashboard.
// Weekly hours + one-off dates (public holidays / special trading). All times are Melbourne local time.
// These drive the Visit Store page, the confirmation page and the booking time slots.

function toHHMM(minutes) {
  if (minutes == null) return "";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hoursBody(closed, open, close) {
  return closed
    ? { openMinute: null, closeMinute: null }
    : { openMinute: toMinutes(open), closeMinute: toMinutes(close) };
}

const inputCls = "rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400";

export default function AdminHours({ apiJson }) {
  const [weekly, setWeekly] = useState([]); // [{ dayOfWeek, day, closed, open, close }]
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingDay, setSavingDay] = useState(null);

  const [newDate, setNewDate] = useState("");
  const [newClosed, setNewClosed] = useState(true);
  const [newOpen, setNewOpen] = useState("09:00");
  const [newClose, setNewClose] = useState("17:00");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson("/api/admin/store-hours", { method: "GET" });
      setWeekly(
        (data.weekly || []).map((w) => ({
          dayOfWeek: w.dayOfWeek,
          day: w.day,
          closed: w.openMinute == null,
          open: toHHMM(w.openMinute) || "09:00",
          close: toHHMM(w.closeMinute) || "17:00",
        }))
      );
      setOverrides(data.overrides || []);
    } catch (e) {
      setError(e.message || "Failed to load hours");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDay(dayOfWeek, patch) {
    setWeekly((rows) => rows.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)));
  }

  async function saveDay(row) {
    setSavingDay(row.dayOfWeek);
    try {
      await apiJson(`/api/admin/store-hours/${row.dayOfWeek}`, {
        method: "PUT",
        body: JSON.stringify(hoursBody(row.closed, row.open, row.close)),
      });
      await load();
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSavingDay(null);
    }
  }

  async function addOverride() {
    if (!newDate) {
      alert("Pick a date.");
      return;
    }
    setAdding(true);
    try {
      await apiJson(`/api/admin/store-overrides/${newDate}`, {
        method: "PUT",
        body: JSON.stringify({ ...hoursBody(newClosed, newOpen, newClose), note: newNote }),
      });
      setNewDate("");
      setNewNote("");
      await load();
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setAdding(false);
    }
  }

  async function deleteOverride(date) {
    if (!confirm(`Remove special hours for ${date}?`)) return;
    try {
      await apiJson(`/api/admin/store-overrides/${date}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <h2 className="text-2xl font-semibold text-[#334578]">Opening Hours</h2>
      <p className="text-sm text-[#334578]/70 mt-1">
        Melbourne time. Used by the Visit Store page and booking time slots (last slot starts 30 min before closing).
      </p>

      {loading && weekly.length === 0 ? (
        <div className="mt-4 text-[#334578]/70">Loading...</div>
      ) : error ? (
        <div className="mt-4 text-red-600 font-semibold">{error}</div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {weekly.map((r) => (
              <div key={r.dayOfWeek} className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-2">
                <div className="w-28 font-semibold text-[#334578]">{r.day}</div>
                <label className="flex items-center gap-2 text-sm text-[#334578]">
                  <input
                    type="checkbox"
                    checked={r.closed}
                    onChange={(e) => updateDay(r.dayOfWeek, { closed: e.target.checked })}
                  />
                  Closed
                </label>
                <input
                  type="time"
                  step="1800"
                  value={r.open}
                  disabled={r.closed}
                  onChange={(e) => updateDay(r.dayOfWeek, { open: e.target.value })}
                  className={inputCls}
                />
                <span className="text-[#334578]/60">to</span>
                <input
                  type="time"
                  step="1800"
                  value={r.close}
                  disabled={r.closed}
                  onChange={(e) => updateDay(r.dayOfWeek, { close: e.target.value })}
                  className={inputCls}
                />
                <button
                  onClick={() => saveDay(r)}
                  disabled={savingDay === r.dayOfWeek}
                  className="ml-auto px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-[#334578] disabled:opacity-50"
                >
                  {savingDay === r.dayOfWeek ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-[#334578] mt-8">Public holidays &amp; special hours</h3>
          <p className="text-sm text-[#334578]/70 mt-1">
            A date here replaces that day’s weekly hours. Existing bookings on that date are not cancelled automatically.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#334578] mb-1">Date</label>
              <input
                type="date"
                min={melbourneNow().isoDate}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#334578] pb-2">
              <input type="checkbox" checked={newClosed} onChange={(e) => setNewClosed(e.target.checked)} />
              Closed all day
            </label>
            <input
              type="time"
              step="1800"
              value={newOpen}
              disabled={newClosed}
              onChange={(e) => setNewOpen(e.target.value)}
              className={inputCls}
            />
            <input
              type="time"
              step="1800"
              value={newClose}
              disabled={newClosed}
              onChange={(e) => setNewClose(e.target.value)}
              className={inputCls}
            />
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-[#334578] mb-1">Note (shown to customers)</label>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Melbourne Cup"
                className={`${inputCls} w-full`}
              />
            </div>
            <button
              onClick={addOverride}
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-full"
            >
              {adding ? "Saving..." : "Add"}
            </button>
          </div>

          <div className="mt-4 overflow-auto border border-gray-200 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 font-semibold text-[#334578]">Date</th>
                  <th className="p-3 font-semibold text-[#334578]">Hours</th>
                  <th className="p-3 font-semibold text-[#334578]">Note</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {overrides.length === 0 ? (
                  <tr>
                    <td className="p-4 text-[#334578]/70" colSpan={4}>
                      No upcoming holidays or special hours.
                    </td>
                  </tr>
                ) : (
                  overrides.map((o) => (
                    <tr key={o.date} className="border-t border-gray-200">
                      <td className="p-3 text-[#334578]/80">{o.date}</td>
                      <td className="p-3 text-[#334578]/80">
                        {o.openMinute == null ? "Closed" : `${toHHMM(o.openMinute)} – ${toHHMM(o.closeMinute)}`}
                      </td>
                      <td className="p-3 text-[#334578]/80">{o.note || "-"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteOverride(o.date)}
                          className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-[#334578] font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
