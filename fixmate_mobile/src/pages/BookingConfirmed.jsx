import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  MailCheck,
  MapPin,
  Phone,
  Clock,
  CalendarPlus,
  Home,
  Smartphone,
  KeyRound,
  LocateOff,
  Copy,
  Check,
} from "lucide-react";
import { STORE, deviceLabel, fetchStoreHours, melbourneNow } from "../lib/store";
import { downloadIcs, loadConfirmedBooking } from "../lib/booking";

function centsToAud(cents) {
  return (Number(cents) / 100).toFixed(2);
}

// Keep this page out of search results (Vercel also sends X-Robots-Tag for /booking/*).
// index.html already has <meta name="robots" content="index, follow">, so switch that tag rather than adding a second one.
function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (created) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (created) meta.remove();
      else meta.content = previous;
    };
  }, []);
}

export default function BookingConfirmed() {
  const location = useLocation();
  useNoIndex();

  // Router state after a successful submit; sessionStorage after a refresh. Never anything else.
  const [booking] = useState(() => location.state?.booking || loadConfirmedBooking());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f9f8]">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-4">
        {booking ? <Confirmed booking={booking} /> : <CheckEmail />}
        <StoreCard />
        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 hover:bg-gray-50 text-[#334578] font-semibold px-6 py-3 rounded-full"
        >
          <Home className="w-4 h-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}

function Confirmed({ booking }) {
  const [copied, setCopied] = useState(false);
  const isApple = String(booking.brand || "").toLowerCase().startsWith("apple");
  const hasPrice = booking.estimatedPrice != null && booking.estimatedPrice > 0;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the reference is still on screen
    }
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" aria-hidden="true" />
        <h1 className="mt-3 text-3xl md:text-4xl font-serif text-[#334578]">Booking confirmed</h1>
        <p className="mt-2 text-[#334578]/80">
          Thanks{booking.fullName ? `, ${booking.fullName}` : ""}. We’ve received your booking.
        </p>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-4 py-5">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Booking reference</div>
          <div className="mt-1 font-mono text-4xl md:text-5xl font-extrabold tracking-widest text-[#0044ff] select-all">
            {booking.reference}
          </div>
          <button
            type="button"
            onClick={copyReference}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy reference"}
          </button>
          <div className="mt-1 text-xs text-[#334578]/60">Screenshot this page or quote it when you call.</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#334578]">Summary</h2>
        <dl className="mt-3 divide-y divide-gray-100 text-sm">
          {booking.slotLabel && <Row label="When" value={booking.slotLabel} strong />}
          <Row label="Device" value={deviceLabel(booking.brand, booking.model)} />
          <Row label="Repair" value={booking.issue} />
          <Row
            label="Price"
            value={
              hasPrice ? (
                <>
                  ${centsToAud(booking.estimatedPrice)}{" "}
                  <span className="block text-xs font-normal text-[#334578]/60">
                    indicative, subject to inspection
                  </span>
                </>
              ) : (
                "To be quoted after inspection"
              )
            }
          />
          {booking.fullName && <Row label="Name" value={booking.fullName} />}
        </dl>

        {booking.slotStart && (
          <button
            type="button"
            onClick={() => downloadIcs(booking)}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full"
          >
            <CalendarPlus className="w-4 h-4" /> Add to calendar
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#334578]">What happens next</h2>
        <p className="mt-2 text-sm text-[#334578]/80">
          We’ll contact you to confirm your booking. A copy has been sent to your email.
        </p>
        <h3 className="mt-4 text-sm font-semibold text-[#334578]">Please bring</h3>
        <ul className="mt-2 space-y-2 text-sm text-[#334578]/80">
          <li className="flex gap-3">
            <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" /> Your device
          </li>
          <li className="flex gap-3">
            <KeyRound className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" /> Your passcode, so we can test the device
            after the repair
          </li>
          {isApple && (
            <li className="flex gap-3">
              <LocateOff className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" /> Find My turned off (Settings → your
              name → Find My), if you can
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

// Shown when there is no booking in memory (e.g. storage blocked, or the page was opened directly).
// It never claims a booking exists: it points to the email that a real booking always sends.
function CheckEmail() {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 text-center">
      <MailCheck className="w-14 h-14 text-blue-600 mx-auto" aria-hidden="true" />
      <h1 className="mt-3 text-3xl font-serif text-[#334578]">Check your email</h1>
      <p className="mt-2 text-[#334578]/80">
        If you’ve just made a booking, your confirmation and booking reference are in your email. Can’t find it?
        Check your spam folder or give us a call.
      </p>
      <Link
        to="/quote"
        className="mt-5 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full"
      >
        Make a booking
      </Link>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-[#334578]/60">{label}</dt>
      <dd className={`text-right text-[#334578] ${strong ? "font-bold" : "font-semibold"}`}>{value}</dd>
    </div>
  );
}

function StoreCard() {
  const [hours, setHours] = useState(null);
  const [hoursError, setHoursError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStoreHours()
      .then((h) => !cancelled && setHours(h))
      .catch(() => !cancelled && setHoursError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const today = melbourneNow().dayOfWeek;

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
      <a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="flex gap-4 p-5 hover:bg-gray-50">
        <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
        <div className="text-sm">
          <div className="font-semibold text-[#334578]">{STORE.name}</div>
          <div className="text-[#334578]/70">
            {STORE.addressLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div className="mt-1 font-semibold text-blue-700">Open in Google Maps</div>
        </div>
      </a>

      <div className="flex gap-4 p-5">
        <Clock className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
        <div className="text-sm flex-1">
          <div className="font-semibold text-[#334578]">Opening hours</div>
          {hours ? (
            <ul className="mt-1 space-y-0.5 text-[#334578]/70">
              {hours.weekly.map((d) => (
                <li
                  key={d.dayOfWeek}
                  className={`flex justify-between ${d.dayOfWeek === today ? "font-bold text-[#334578]" : ""}`}
                >
                  <span>{d.day}</span>
                  <span>{d.label}</span>
                </li>
              ))}
            </ul>
          ) : hoursError ? (
            <Link to="/visit-store" className="text-blue-700 font-semibold">
              See our opening hours
            </Link>
          ) : (
            <div className="text-[#334578]/60">Loading...</div>
          )}
        </div>
      </div>

      <a
        href={STORE.phoneHref}
        className="flex items-center justify-center gap-2 m-4 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full"
      >
        <Phone className="w-4 h-4" /> Call {STORE.phone}
      </a>
    </div>
  );
}
