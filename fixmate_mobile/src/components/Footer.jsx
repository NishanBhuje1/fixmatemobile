import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Newsletter:", email);
    alert("Thanks! You’re subscribed.");
    setEmail("");
  };

  return (
    <footer className="bg-[#1e293b] text-white pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand & About */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold tracking-tight text-white">
              FixMate Mobile
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted partner for fast, reliable, and professional device
              repairs. We bring life back to your technology with quality parts
              and expert service.
            </p>
            <div className="flex gap-4">
              <SocialIcon
                href="https://www.facebook.com/share/187nFG752k/?mibextid=wwXIfr"
                icon={<Facebook className="w-5 h-5" />}
              />
              <SocialIcon
                href="https://www.instagram.com/fixmate.mobile/"
                icon={<Instagram className="w-5 h-5" />}
              />
              {/* <SocialIcon href="#" icon={<Twitter className="w-5 h-5" />} />
              <SocialIcon href="#" icon={<Linkedin className="w-5 h-5" />} /> */}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome"
                  className="hover:text-blue-400 transition-colors"
                >
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link
                  to="/quote"
                  className="hover:text-blue-400 transition-colors"
                >
                  Get a Quote
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-blue-400 transition-colors"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Contact Us</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <a
                href="tel:+61388208183"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                (03) 8820 8183
              </a>
              <a
                href="mailto:support@fixmatemobile.com"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                support@fixmatemobile.com
              </a>
              <Link
                to="/visit-store"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Visit Our Store</span>
              </Link>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get special offers and repair tips.
            </p>
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} FixMate Mobile. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>

            {/* Admin Link with Icon */}
            <Link
              to="/admin"
              className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper Component for Social Icons
function SocialIcon({ href, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 bg-white/5 rounded-full hover:bg-white hover:text-[#1e293b] text-gray-400 transition-all duration-300 transform hover:-translate-y-1"
    >
      {icon}
    </a>
  );
}
