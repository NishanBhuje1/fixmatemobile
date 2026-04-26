import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Mail,
  MessageSquare,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
} from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success'

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");

    // Simulate network request (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Contact form:", form);
    setStatus("success");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center bg-[#f1f9f8] overflow-hidden px-4 py-12">
      {/* 1. Ambient Background */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Context & Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-[#334578] mb-4">
                Get in touch
              </h1>
              <p className="text-[#334578]/70 text-lg leading-relaxed">
                Have a question about your repair? Need a custom quote? Drop us
                a line and our team will get back to you today.
              </p>
            </div>

            <div className="space-y-6">
              <ContactItem
                icon={<Phone />}
                title="Call Us"
                detail="(03) 8820 8183"
                href="tel:0388208183"
              />
              <ContactItem
                icon={<Mail />}
                title="Email Us"
                detail="support@fixmatemobile.com"
                href="mailto:support@fixmatemobile.com"
              />
              <ContactItem
                icon={<MapPin />}
                title="Visit Us"
                detail={`Eastland Shopping Centre,
                175 Maroondah Hwy, Ringwood,
                VIC 3134`}
                href="https://www.google.com/maps/search/?api=1&query=Eastland+Shopping+Centre+175+Maroondah+Hwy+Ringwood+VIC+3134"
              />
            </div>
          </motion.div>

          {/* Right Column: Glassmorphic Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-6 md:p-8"
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                // Success State View
                <SuccessView onReset={() => setStatus("idle")} />
              ) : (
                // Form View
                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputField
                    label="Full Name"
                    name="name"
                    type="text"
                    icon={<User className="w-5 h-5" />}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />

                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={<Mail className="w-5 h-5" />}
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-[#334578] mb-2">
                      Message
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-4 text-[#334578]/50">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-[#334578] placeholder:text-gray-400"
                        placeholder="Tell us about your device issue..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-[#334578] hover:bg-[#2a3a66] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/10"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function InputField({ label, name, type, icon, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#334578] mb-2">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#334578]/50 group-focus-within:text-blue-600 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#334578] placeholder:text-gray-400"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function ContactItem({ icon, title, detail, href }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 border border-white/50 hover:bg-white/80 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group cursor-pointer"
    >
      <div className="p-3 bg-blue-100 rounded-xl text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        <div className="w-6 h-6">{icon}</div>
      </div>
      <div>
        <h3 className="font-semibold text-[#334578] group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-[#334578]/70 text-sm whitespace-pre-line">
          {detail}
        </p>
      </div>
    </a>
  );
}

function SuccessView({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center text-center py-12"
    >
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-serif text-[#334578] mb-2">Message Sent!</h3>
      <p className="text-[#334578]/70 mb-8 max-w-xs mx-auto">
        Thanks for reaching out. We've received your message and will reply
        shortly.
      </p>
      <button
        onClick={onReset}
        className="text-sm font-semibold text-[#334578] hover:text-blue-600 transition-colors"
      >
        Send another message
      </button>
    </motion.div>
  );
}