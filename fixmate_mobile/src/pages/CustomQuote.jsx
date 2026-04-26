import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function CustomQuote() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    model: "",
    issue: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    form.fullName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.model.trim() &&
    form.issue.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        type: "Custom Quote",
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        brand: "",
        model: form.model,
        issue: form.issue,
        message: form.message || "",
      };

      const res = await fetch(`${API}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to submit custom quote");

      alert("Thanks! We received your request and will contact you shortly.");
      navigate("/");
    } catch (err) {
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f9f8]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#334578]">
              Request a Custom Quote
            </h1>
            <p className="text-[#334578]/80 mt-1">
              If your device isn’t listed, submit this form and we’ll get back to you.
            </p>
          </div>
          <Link to="/quote" className="text-blue-700 hover:text-blue-800 font-semibold">
            Back to Quote
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="you@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="04xx xxx xxx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Phone model <span className="text-red-500">*</span>
              </label>
              <input
                value={form.model}
                onChange={(e) => updateField("model", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. iPhone 12 Pro, Galaxy S21..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Issue <span className="text-red-500">*</span>
              </label>
              <input
                value={form.issue}
                onChange={(e) => updateField("issue", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. screen cracked, battery drains fast..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#334578] mb-2">
                Message (optional)
              </label>
              <textarea
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Any extra details (optional)"
                rows={4}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-2">
              <Link
                to="/"
                className="px-6 py-3 rounded-full border border-gray-200 font-semibold text-[#334578] hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-full transition-colors"
              >
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-sm text-[#334578]/70 mt-5">
          Your request will be saved as a lead in the admin dashboard.
        </p>
      </div>
    </div>
  );
}
