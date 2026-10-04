import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { saveConfirmedBooking } from "../lib/booking";

const API = import.meta.env.VITE_API_URL;

function centsToAud(cents) {
  if (cents == null) return null;
  return (Number(cents) / 100).toFixed(2);
}

// Repair status from /api/catalog: PRICED | QUOTE_ONLY | NOT_AVAILABLE
function issueLabel(issue, status) {
  if (status === "NOT_AVAILABLE") return `${issue} — Not available`;
  if (status === "QUOTE_ONLY") return `${issue} — Get a quote`;
  return issue;
}

// Home page service names that don't match a catalog repair name directly
const ISSUE_ALIASES = { "camera repair": "camera replacement" };

// Bookable repair matching a wanted name (e.g. ?issue=Screen Replacement), exact match first, then prefix
function matchIssue(issues = [], statuses = {}, wanted) {
  if (!wanted) return "";
  const bookable = issues.filter((i) => statuses[i] !== "NOT_AVAILABLE");
  const w = wanted.trim().toLowerCase();
  const target = ISSUE_ALIASES[w] || w;
  return (
    bookable.find((i) => i.toLowerCase() === target) ||
    bookable.find((i) => i.toLowerCase().startsWith(target)) ||
    ""
  );
}

function firstBookableIssue(issues = [], statuses = {}, preferred = "") {
  return (
    matchIssue(issues, statuses, preferred) ||
    issues.find((i) => statuses[i] !== "NOT_AVAILABLE") ||
    ""
  );
}

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// ✅ CHANGE: helper to safely fire Google Ads conversion
function fireLeadConversion({ valueAud = 1.0 } = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") {
    console.warn("gtag not available yet (conversion not fired).");
    return;
  }

  window.gtag("event", "conversion", {
    send_to: "AW-17866911941/hh9aCI-t2-AbEMXhzcdC",
    value: valueAud,
    currency: "AUD",
  });
}

export default function Quote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);

  // catalog from DB
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [brands, setBrands] = useState([]);
  const [modelsByBrand, setModelsByBrand] = useState({});
  const [issuesByBrandModel, setIssuesByBrandModel] = useState({});
  const [issueStatusByBrandModel, setIssueStatusByBrandModel] = useState({});

  // selection
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");

  // pricing
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [priceCents, setPriceCents] = useState(null);
  const [quoteOnly, setQuoteOnly] = useState(false); // repair has no fixed price

  // booking fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // repair the customer wants (from ?issue= or their last choice), kept across model changes
  const issueParam = searchParams.get("issue") || "";
  const [preferredIssue, setPreferredIssue] = useState(issueParam);

  // time slots (Melbourne time, from the backend)
  const [availability, setAvailability] = useState(null); // { days: [...] }
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotStart, setSlotStart] = useState("");

  // submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // set synchronously, so a fast double-click can't send two requests before React re-renders
  const submittingRef = useRef(false);

  // Load catalog once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const res = await fetchWithTimeout(`${API}/api/catalog`, {}, 10000);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load catalog");

        if (cancelled) return;

        setBrands(data.brands || []);
        setModelsByBrand(data.modelsByBrand || {});
        setIssuesByBrandModel(data.issuesByBrandModel || {});
        setIssueStatusByBrandModel(data.issueStatusByBrandModel || {});

        // set defaults, honouring ?brand=...&model=... when they exist in the catalog
        const brandList = data.brands || [];
        const wantedBrand = searchParams.get("brand");
        const firstBrand = brandList.includes(wantedBrand)
          ? wantedBrand
          : brandList[0] || "";
        setBrand(firstBrand);

        const modelList = data.modelsByBrand?.[firstBrand] || [];
        const wantedModel = searchParams.get("model");
        const firstModel = modelList.includes(wantedModel)
          ? wantedModel
          : modelList[0] || "";
        setModel(firstModel);

        const key = `${firstBrand}||${firstModel}`;
        setIssue(
          firstBookableIssue(
            data.issuesByBrandModel?.[key],
            data.issueStatusByBrandModel?.[key],
            issueParam
          )
        );
      } catch (e) {
        if (!cancelled) setCatalogError(e.message || "Catalog failed");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // load once; ?brand/?model/?issue only set the initial selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // computed lists
  const models = useMemo(
    () => (brand ? modelsByBrand[brand] || [] : []),
    [brand, modelsByBrand]
  );

  const issues = useMemo(() => {
    if (!brand || !model) return [];
    return issuesByBrandModel[`${brand}||${model}`] || [];
  }, [brand, model, issuesByBrandModel]);

  function next() {
    setStep((s) => Math.min(3, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  const issueStatuses = useMemo(
    () => issueStatusByBrandModel[`${brand}||${model}`] || {},
    [brand, model, issueStatusByBrandModel]
  );

  // ?issue= asked for a repair this model doesn't list (e.g. "Water Damage Check")
  const issueParamUnmatched = Boolean(
    issueParam &&
      preferredIssue === issueParam &&
      issues.length > 0 &&
      !matchIssue(issues, issueStatuses, issueParam)
  );

  // keep model/issue valid when brand or model changes, keeping the customer's preferred repair if offered
  // (done in the handlers, not effects, so a model pre-selected from the URL isn't overwritten)
  function selectModel(b, m) {
    setModel(m);
    const key = `${b}||${m}`;
    setIssue(
      firstBookableIssue(
        issuesByBrandModel[key],
        issueStatusByBrandModel[key],
        preferredIssue
      )
    );
  }

  function selectIssue(i) {
    setIssue(i);
    setPreferredIssue(i);
  }

  function selectBrand(b) {
    setBrand(b);
    selectModel(b, (modelsByBrand[b] || [])[0] || "");
  }

  // fetch price when entering step 2 or when selection changes on step2
  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      if (step !== 2) return;
      if (!brand || !model || !issue) return;

      setLoadingPrice(true);
      setPriceError("");
      setPriceCents(null);
      setQuoteOnly(false);

      try {
        const url =
          `${API}/api/pricing?brand=${encodeURIComponent(brand)}` +
          `&model=${encodeURIComponent(model)}` +
          `&issue=${encodeURIComponent(issue)}`;

        const res = await fetchWithTimeout(url, {}, 8000);
        const data = await res.json().catch(() => ({}));
        if (data.status === "NOT_AVAILABLE") {
          throw new Error("This repair is not available for this model");
        }
        // New API answers quote-only repairs with 404 + status; an older API answers 200 + price: null
        const isQuote = data.status === "QUOTE_ONLY" || (res.ok && data.price == null);
        if (!res.ok && !isQuote) throw new Error(data?.error || "Price not found");

        if (cancelled) return;
        // Only a positive number is a real price; anything else (null, 0, junk) is "Get a quote", never $0.00
        const cents = data.price == null ? NaN : Number(data.price);
        if (isQuote || !(cents > 0)) setQuoteOnly(true);
        else setPriceCents(cents);
      } catch (e) {
        if (!cancelled) setPriceError(e.message || "Failed to fetch price");
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    }

    loadPrice();
    return () => {
      cancelled = true;
    };
  }, [step, brand, model, issue]);

  const canGoStep2 = Boolean(
    brand && model && issue && issueStatuses[issue] !== "NOT_AVAILABLE"
  );
  const hasPriceOrQuote = priceCents != null || quoteOnly;
  const canGoStep3 = Boolean(hasPriceOrQuote && !loadingPrice);
  const canSubmit = Boolean(
    fullName.trim() &&
      phone.trim() &&
      email.trim() &&
      slotStart &&
      hasPriceOrQuote &&
      !submitting
  );

  // Slots come from the backend in Melbourne time; reloaded every time step 3 opens and after a slot clash
  async function loadAvailability({ keepSlot = true } = {}) {
    setAvailLoading(true);
    setAvailError("");
    try {
      const res = await fetchWithTimeout(`${API}/api/booking/availability`, {}, 10000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not load available times");

      const days = data.days || [];
      setAvailability({ days });

      const hasFree = (d) => d && !d.closed && d.slots.some((s) => s.available);
      setSelectedDate((current) =>
        hasFree(days.find((d) => d.date === current))
          ? current
          : days.find(hasFree)?.date || days[0]?.date || ""
      );
      setSlotStart((current) => {
        if (!keepSlot) return "";
        const still = days.flatMap((d) => d.slots).find((s) => s.start === current);
        return still?.available ? current : "";
      });
    } catch (e) {
      setAvailError(
        e.name === "AbortError" ? "Loading times took too long." : e.message || "Could not load available times"
      );
    } finally {
      setAvailLoading(false);
    }
  }

  useEffect(() => {
    if (step === 3) loadAvailability();
  }, [step]);

  const selectedDay = availability?.days.find((d) => d.date === selectedDate) || null;
  const selectedSlot = selectedDay?.slots.find((s) => s.start === slotStart) || null;

  async function handleBook(e) {
    e.preventDefault();
    if (!canSubmit || submittingRef.current) return; // one request at a time

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        type: "Quote Booking",
        fullName,
        email,
        phone,
        brand,
        model,
        issue,
        slotStart, // exact slot; the server re-checks hours, notice and capacity
        estimatedPrice: priceCents, // cents
        message: "",
      };

      const res = await fetchWithTimeout(
        `${API}/api/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        10000
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === "SLOT_FULL" || data?.code === "SLOT_INVALID") {
          // someone took the last place (or the time passed): refresh times, keep everything else
          loadAvailability({ keepSlot: false });
        }
        throw new Error(data?.error || "Failed to submit booking");
      }

      /* 🔧 GOOGLE ADS CONVERSION TRACKING */

      if (window.gtag) {
        window.gtag("event", "conversion", {
          send_to: "AW-17866911941/k8DQCNnkouEbEMXhzcdC",
          value: 1.0,
          currency: "AUD",
        });
      }

      // Only reached after the API confirmed the booking was saved
      const booking = data.booking || null;
      if (booking) saveConfirmedBooking(booking);
      navigate("/booking/confirmed", { state: { booking } });
    } catch (err) {
      // Stay on the form with every input intact
      setSubmitError(
        err.name === "AbortError"
          ? "The request timed out, so we can't tell if your booking went through. Please check your email or call us before trying again."
          : err.message || "Booking failed. Please try again."
      );
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f9f8]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#334578]">
              Get a Repair Quote
            </h1>
            <p className="text-[#334578]/80 mt-1">
              3 steps: Select → Price → Book
            </p>
          </div>
          <Link
            to="/"
            className="text-blue-700 hover:text-blue-800 font-semibold"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <StepPill active={step === 1} done={step > 1} label="1. Select" />
            <div className="h-px flex-1 bg-gray-200" />
            <StepPill active={step === 2} done={step > 2} label="2. Price" />
            <div className="h-px flex-1 bg-gray-200" />
            <StepPill active={step === 3} done={false} label="3. Book" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {catalogLoading ? (
            <div className="text-[#334578]/80">Loading phone list...</div>
          ) : catalogError ? (
            <div className="text-red-600 font-semibold">
              Catalog error: {catalogError}
            </div>
          ) : null}

          {step === 1 && !catalogLoading && !catalogError && (
            <div>
              <h2 className="text-2xl font-semibold text-[#334578] mb-4">
                Step 1: Select your device
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Brand
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => selectBrand(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <option value="">Select brand</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => selectModel(brand, e.target.value)}
                    disabled={!brand}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 disabled:bg-gray-50"
                  >
                    <option value="">
                      {brand ? "Select model" : "Select brand first"}
                    </option>
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Repair Type
                  </label>
                  <select
                    value={issue}
                    onChange={(e) => selectIssue(e.target.value)}
                    disabled={!brand || !model}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 disabled:bg-gray-50"
                  >
                    <option value="">
                      {model ? "Select repair type" : "Select model first"}
                    </option>
                    {issues.map((i) => (
                      <option
                        key={i}
                        value={i}
                        disabled={issueStatuses[i] === "NOT_AVAILABLE"}
                      >
                        {issueLabel(i, issueStatuses[i])}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {issueParamUnmatched && (
                <p className="mt-4 text-sm text-[#334578]/80 bg-blue-50 rounded-xl px-4 py-3">
                  “{issueParam}” isn’t listed for this model. Choose the
                  closest repair above, or{" "}
                  <Link
                    to="/custom-quote"
                    className="text-blue-700 hover:text-blue-800 font-semibold"
                  >
                    request a custom quote
                  </Link>
                  .
                </p>
              )}

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-[#334578]/80">
                  Can’t find your device?{" "}
                  <Link
                    to="/custom-quote"
                    className="text-blue-700 hover:text-blue-800 font-semibold"
                  >
                    Request a custom quote
                  </Link>
                  .
                </div>

                <button
                  onClick={next}
                  disabled={!canGoStep2}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-full"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-[#334578] mb-4">
                Step 2: Estimated price
              </h2>

              {/* Big Price Card */}
              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Top section */}
                <div className="p-6 md:p-8 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                    {quoteOnly ? "Quote required" : "Estimated cost only"}
                  </div>

                  <div className="mt-4 text-lg md:text-xl font-semibold text-[#334578]">
                    {brand}
                  </div>
                  <div className="mt-4 text-lg md:text-xl font-semibold text-[#334578]">
                    {model}
                  </div>

                  <div className="mt-1 text-[#334578]/80">{issue}</div>

                  <div className="mt-6">
                    {loadingPrice ? (
                      <div className="text-[#334578]/80">Loading price...</div>
                    ) : priceCents != null ? (
                      <>
                        <div className="text-[#334578]/70 text-sm">
                          Estimated price
                        </div>
                        <div className="mt-2 text-5xl md:text-6xl font-extrabold text-[#0044ff] leading-none">
                          ${centsToAud(priceCents)}
                        </div>
                        <div className="mt-3 text-sm text-[#334578]/70">
                          Please call or visit our store to confirm final
                          pricing.
                        </div>
                      </>
                    ) : quoteOnly ? (
                      <>
                        <div className="text-3xl md:text-4xl font-extrabold text-[#0044ff] leading-none">
                          Get a quote
                        </div>
                        <div className="mt-3 text-sm text-[#334578]/70">
                          We don’t have a fixed price for this repair yet. Book
                          an appointment and we’ll quote you after a quick
                          inspection.
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600 font-semibold">
                        {priceError
                          ? `Price error: ${priceError}`
                          : "No price found for this selection."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-200">
                  <button
                    onClick={back}
                    className="px-6 py-4 font-semibold text-[#334578] hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>

                  <button
                    onClick={next}
                    disabled={!canGoStep3}
                    className="px-6 py-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {quoteOnly ? "Get a quote" : "Book appointment now"}
                  </button>

                  <Link
                    to="/visit-store"
                    className="px-6 py-4 font-semibold text-[#334578] bg-[#f1f9f8] hover:bg-[#e7f4f2] transition-colors text-center"
                  >
                    Visit our store
                  </Link>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-[#334578] mb-4">
                Step 3: Book appointment
              </h2>

              <div className="rounded-2xl border border-gray-200 p-5 mb-5">
                <div className="text-sm text-[#334578]/80">Summary</div>
                <div className="mt-1 font-semibold text-[#334578]">
                  {brand} • {model} • {issue}{" "}
                  {priceCents != null ? (
                    <span className="font-normal text-[#334578]/80">
                      (Price: ${centsToAud(priceCents)})
                    </span>
                  ) : quoteOnly ? (
                    <span className="font-normal text-[#334578]/80">
                      (Price: To be quoted)
                    </span>
                  ) : null}
                </div>
              </div>

              <form onSubmit={handleBook} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Phone number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                {/* min-w-0: lets the scrolling day row shrink instead of widening the page on phones */}
                <div className="md:col-span-2 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="block text-sm font-semibold text-[#334578]">
                      Choose a time
                    </span>
                    <span className="text-xs text-[#334578]/60">
                      Melbourne time · 30 min slots
                    </span>
                  </div>

                  {availLoading && !availability ? (
                    <div className="text-[#334578]/80 text-sm py-3">
                      Loading available times...
                    </div>
                  ) : availError && !availability ? (
                    <div className="text-sm py-3">
                      <span className="text-red-600 font-semibold">{availError}</span>{" "}
                      <button
                        type="button"
                        onClick={() => loadAvailability()}
                        className="text-blue-700 hover:text-blue-800 font-semibold"
                      >
                        Try again
                      </button>
                    </div>
                  ) : availability ? (
                    <>
                      {/* Day chips */}
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                        {availability.days.map((d) => {
                          const free = d.slots.filter((s) => s.available).length;
                          const disabled = d.closed || free === 0;
                          const active = d.date === selectedDate;
                          return (
                            <button
                              key={d.date}
                              type="button"
                              disabled={disabled}
                              onClick={() => setSelectedDate(d.date)}
                              aria-pressed={active}
                              className={`shrink-0 min-w-[84px] rounded-xl border px-3 py-2 text-left transition-colors ${
                                active
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : disabled
                                  ? "border-gray-100 bg-gray-50 text-gray-400"
                                  : "border-gray-200 bg-white text-[#334578] hover:border-blue-300"
                              }`}
                            >
                              <div className="text-sm font-semibold">{d.label}</div>
                              <div className={`text-xs ${active ? "text-white/80" : ""}`}>
                                {d.closed
                                  ? "Closed"
                                  : d.slots.length === 0
                                  ? "No times left"
                                  : free === 0
                                  ? "Full"
                                  : `${free} times`}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Slots for the chosen day: full slots stay visible but disabled */}
                      {selectedDay && !selectedDay.closed && selectedDay.slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                          {selectedDay.slots.map((s) => {
                            const active = s.start === slotStart;
                            return (
                              <button
                                key={s.start}
                                type="button"
                                disabled={!s.available}
                                onClick={() => setSlotStart(s.start)}
                                aria-pressed={active}
                                aria-label={s.available ? s.label : `${s.label}, unavailable`}
                                className={`rounded-xl border px-2 py-3 text-sm font-semibold transition-colors ${
                                  active
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : s.available
                                    ? "border-gray-200 bg-white text-[#334578] hover:border-blue-300"
                                    : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                <span className={s.available ? "" : "line-through"}>{s.label}</span>
                                {!s.available && (
                                  <span className="block text-[11px] font-normal no-underline">
                                    Unavailable
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-[#334578]/70 py-3">
                          {selectedDay?.closed
                            ? `We’re closed this day${selectedDay.note ? ` (${selectedDay.note})` : ""}. Please pick another day.`
                            : "No times left on this day. Please pick another day."}
                        </div>
                      )}

                      <div className="mt-3 text-sm text-[#334578]" aria-live="polite">
                        {selectedSlot ? (
                          <>
                            Selected:{" "}
                            <span className="font-semibold">
                              {selectedDay.label}, {selectedSlot.label}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#334578]/60">No time selected yet.</span>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                <div className="md:col-span-2 flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={back}
                    disabled={submitting}
                    className="px-6 py-3 rounded-full border border-gray-200 font-semibold text-[#334578] hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    aria-busy={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-full"
                  >
                    {submitting ? "Booking..." : "Confirm booking"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPill({ active, done, label }) {
  const base = "px-4 py-2 rounded-full text-sm font-semibold transition-colors";
  const cls = done
    ? `${base} bg-green-50 text-green-700`
    : active
    ? `${base} bg-blue-600 text-white`
    : `${base} bg-gray-100 text-gray-600`;
  return <div className={cls}>{label}</div>;
}
