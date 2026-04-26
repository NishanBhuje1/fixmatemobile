import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const LS_ADMIN_TOKEN = "fixmate_admin_token_v1";

// ---------- token helpers ----------
function getToken() {
  return localStorage.getItem(LS_ADMIN_TOKEN) || "";
}
function setToken(token) {
  localStorage.setItem(LS_ADMIN_TOKEN, token);
}
function clearToken() {
  localStorage.removeItem(LS_ADMIN_TOKEN);
}

// ---------- money helpers (AUD <-> cents) ----------
function audToCents(audString) {
  const n = Number(String(audString).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
function centsToAud(cents) {
  if (cents == null) return "";
  return (Number(cents) / 100).toFixed(2);
}

// ---------- fetch helper (adds Bearer token automatically) ----------
async function apiJson(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(Boolean(getToken()));

  // login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // pricing list
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // add/update form
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [priceAud, setPriceAud] = useState(""); // user types AUD like 169 or 169.00
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => {
    const brands = new Set();
    const models = new Set();
    const issues = new Set();
    for (const r of rules) {
      if (r.brand) brands.add(r.brand);
      if (r.model) models.add(r.model);
      if (r.issue) issues.add(r.issue);
    }
    return {
      brands: [...brands].sort(),
      models: [...models].sort(),
      issues: [...issues].sort(),
    };
  }, [rules]);

  async function login(e) {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Login failed");

      setToken(data.token);
      setAuthed(true);
      setUsername("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message || "Login failed");
    }
  }

  function logout() {
    clearToken();
    setAuthed(false);
    setRules([]);
  }

  async function loadPricing() {
    setLoadingRules(true);
    try {
      const data = await apiJson("/api/admin/pricing", { method: "GET" });
      setRules(data.rules || []);
    } catch (err) {
      // token invalid/expired
      logout();
    } finally {
      setLoadingRules(false);
    }
  }

  useEffect(() => {
    if (authed) loadPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function saveRule() {
    const b = brand.trim();
    const m = model.trim();
    const i = issue.trim();
    const cents = audToCents(priceAud);

    if (!b || !m || !i) {
      alert("Brand, Model, and Service are required.");
      return;
    }
    if (cents == null || cents <= 0) {
      alert("Enter a valid price in AUD (e.g. 169 or 169.00).");
      return;
    }

    setSaving(true);
    try {
      await apiJson("/api/admin/pricing", {
        method: "PUT",
        body: JSON.stringify({ brand: b, model: m, issue: i, price: cents }),
      });

      await loadPricing();

      // keep your inputs or clear them:
      // setBrand(""); setModel(""); setIssue(""); setPriceAud("");
      alert("Saved.");
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(r) {
    if (!confirm(`Delete?\n${r.brand} / ${r.model} / ${r.issue}`)) return;

    const params = new URLSearchParams({
      brand: r.brand,
      model: r.model,
      issue: r.issue,
    });

    try {
      await apiJson(`/api/admin/pricing?${params.toString()}`, { method: "DELETE" });
      await loadPricing();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  // --------------- LOGIN UI ---------------
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f1f9f8]">
        <div className="max-w-lg mx-auto px-4 py-14">
          <div className="bg-white rounded-2xl shadow-sm p-7">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif text-[#334578]">Admin Login</h1>
              <Link to="/" className="text-blue-700 hover:text-blue-800 font-semibold">
                Back
              </Link>
            </div>

            <form onSubmit={login} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-semibold text-[#334578] mb-2">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#334578] mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  placeholder="••••••••"
                />
              </div>

              {authError ? <div className="text-red-600 font-semibold">{authError}</div> : null}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full"
              >
                Login
              </button>

              <p className="text-xs text-[#334578]/60">
                If you changed token keys, clear site storage/localStorage and login again.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --------------- DASHBOARD UI ---------------
  return (
    <div className="min-h-screen bg-[#f1f9f8]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif text-[#334578]">Admin Pricing</h1>
            <p className="text-[#334578]/75 mt-2">Add brand/model/service and set a fixed price (stored in cents).</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-5 py-2 rounded-full border border-gray-200 text-[#334578] font-semibold hover:bg-gray-50"
            >
              Logout
            </button>
            <Link to="/" className="text-blue-700 hover:text-blue-800 font-semibold">
              Home
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#334578]">Add / Update Price</h2>
              <p className="text-[#334578]/70 mt-1">
                Type new values to create new Brand/Model/Service. Price input is AUD.
              </p>
            </div>

            <button
              onClick={loadPricing}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-[#334578] font-semibold"
            >
              Refresh
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">Brand</label>
              <input
                list="brands"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
                placeholder="Apple"
              />
              <datalist id="brands">
                {suggestions.brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">Model</label>
              <input
                list="models"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
                placeholder="iPhone 15 Pro"
              />
              <datalist id="models">
                {suggestions.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">Service</label>
              <input
                list="issues"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
                placeholder="Screen Replacement"
              />
              <datalist id="issues">
                {suggestions.issues.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">Price (AUD)</label>
              <input
                value={priceAud}
                onChange={(e) => setPriceAud(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
                placeholder="169.00"
                inputMode="decimal"
              />
              <div className="text-xs text-[#334578]/60 mt-1">
                Stored as cents: {priceAud ? audToCents(priceAud) ?? "-" : "-"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveRule}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-full"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#334578]">Existing Prices</h3>
            <div className="text-sm text-[#334578]/70">
              {loadingRules ? "Loading..." : `Total: ${rules.length}`}
            </div>
          </div>

          <div className="mt-4 overflow-auto border border-gray-200 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 font-semibold text-[#334578]">Brand</th>
                  <th className="p-3 font-semibold text-[#334578]">Model</th>
                  <th className="p-3 font-semibold text-[#334578]">Service</th>
                  <th className="p-3 font-semibold text-[#334578]">Price (AUD)</th>
                  <th className="p-3 font-semibold text-[#334578]"></th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td className="p-4 text-[#334578]/70" colSpan={5}>
                      No pricing rules yet.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={`${r.brand}-${r.model}-${r.issue}`} className="border-t border-gray-200">
                      <td className="p-3 text-[#334578]/80">{r.brand}</td>
                      <td className="p-3 text-[#334578]/80">{r.model}</td>
                      <td className="p-3 text-[#334578]/80">{r.issue}</td>
                      <td className="p-3 text-[#334578]/80">${centsToAud(r.price)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteRule(r)}
                          className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-[#334578] font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#334578]/60 mt-3">
            Customers should use public endpoints (catalog/pricing). Admin endpoints remain protected by JWT.
          </p>
        </div>
      </div>
    </div>
  );
}
