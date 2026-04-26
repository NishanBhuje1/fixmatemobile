import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function centsToAud(cents) {
  if (cents == null) return null;
  return (Number(cents) / 100).toFixed(2);
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

  const [step, setStep] = useState(1);

  // catalog from DB
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [brands, setBrands] = useState([]);
  const [modelsByBrand, setModelsByBrand] = useState({});
  const [issuesByBrandModel, setIssuesByBrandModel] = useState({});

  // selection
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");

  // pricing
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [priceCents, setPriceCents] = useState(null);

  // booking fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

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

        // set defaults
        const firstBrand = (data.brands || [])[0] || "";
        setBrand(firstBrand);
        const firstModel = (data.modelsByBrand?.[firstBrand] || [])[0] || "";
        setModel(firstModel);
        const key = `${firstBrand}||${firstModel}`;
        const firstIssue = (data.issuesByBrandModel?.[key] || [])[0] || "";
        setIssue(firstIssue);
      } catch (e) {
        if (!cancelled) setCatalogError(e.message || "Catalog failed");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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

  // keep model/issue valid when brand changes
  useEffect(() => {
    if (!brand) return;
    const m = (modelsByBrand[brand] || [])[0] || "";
    setModel(m);
  }, [brand, modelsByBrand]);

  useEffect(() => {
    if (!brand || !model) return;
    const i = (issuesByBrandModel[`${brand}||${model}`] || [])[0] || "";
    setIssue(i);
  }, [brand, model, issuesByBrandModel]);

  // fetch price when entering step 2 or when selection changes on step2
  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      if (step !== 2) return;
      if (!brand || !model || !issue) return;

      setLoadingPrice(true);
      setPriceError("");
      setPriceCents(null);

      try {
        const url =
          `${API}/api/pricing?brand=${encodeURIComponent(brand)}` +
          `&model=${encodeURIComponent(model)}` +
          `&issue=${encodeURIComponent(issue)}`;

        const res = await fetchWithTimeout(url, {}, 8000);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Price not found");

        if (!cancelled) setPriceCents(Number(data.price));
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

  const canGoStep2 = Boolean(brand && model && issue);
  const canGoStep3 = Boolean(priceCents != null && !loadingPrice);
  const canSubmit = Boolean(
    fullName &&
      phone &&
      email &&
      preferredDate &&
      preferredTime &&
      priceCents != null
  );

  async function handleBook(e) {
    e.preventDefault();

    try {
      const payload = {
        type: "Quote Booking",
        fullName,
        email,
        phone,
        brand,
        model,
        issue,
        preferredDate: preferredDate
          ? new Date(preferredDate).toISOString()
          : null,
        preferredTime,
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
      if (!res.ok) throw new Error(data?.error || "Failed to submit booking");

      /* 🔧 GOOGLE ADS CONVERSION TRACKING */

      if (window.gtag) {
        window.gtag("event", "conversion", {
          send_to: "AW-17866911941/k8DQCNnkouEbEMXhzcdC",
          value: 1.0,
          currency: "AUD",
        });
      }

      alert("Appointment request submitted! We will contact you shortly.");
      navigate("/");
    } catch (err) {
      alert(err.message || "Booking failed. Please try again.");
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
                    onChange={(e) => setBrand(e.target.value)}
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
                    onChange={(e) => setModel(e.target.value)}
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
                    onChange={(e) => setIssue(e.target.value)}
                    disabled={!brand || !model}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 disabled:bg-gray-50"
                  >
                    <option value="">
                      {model ? "Select repair type" : "Select model first"}
                    </option>
                    {issues.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    Estimated cost only
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
                    Book appointment now
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

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Preferred date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#334578] mb-2">
                    Preferred time
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <option value="">Select time</option>
                    <option value="Morning">Morning (9am–12pm)</option>
                    <option value="Afternoon">Afternoon (12pm–4pm)</option>
                    <option value="Evening">Evening (4pm–7pm)</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={back}
                    className="px-6 py-3 rounded-full border border-gray-200 font-semibold text-[#334578] hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-full"
                  >
                    Confirm booking
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
