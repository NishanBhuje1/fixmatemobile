import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.jpg";

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          isActive
            ? "bg-blue-100/50 text-blue-700"
            : "text-[#334578] hover:bg-gray-50 hover:text-blue-600"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeMobile = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm" />

      <nav className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <button
            onClick={() => {
              navigate("/");
              closeMobile();
            }}
            className="flex items-center gap-2 group"
            aria-label="Go to home"
          >
            <motion.img
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src={logo}
              alt="FixMate Mobile"
              className="h-12 w-auto rounded-lg"
            />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavItem to="/" label="Home" />
            <NavItem to="/welcome" label="Welcome" />
            <NavItem to="/quote" label="Get Quote" />
            <NavItem to="/visit-store" label="Visit Our Store" />
            <NavItem to="/contact" label="Contact" />
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 text-[#334578] rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 flex flex-col gap-2">
                <MobileNavItem to="/" label="Home" onClick={closeMobile} />
                <MobileNavItem to="/welcome" label="Welcome" onClick={closeMobile} />
                <MobileNavItem to="/quote" label="Get Quote" onClick={closeMobile} />
                <MobileNavItem to="/visit-store" label="Visit Our Store" onClick={closeMobile} />
                <MobileNavItem to="/contact" label="Contact" onClick={closeMobile} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

// Separate component for Mobile Items to handle full-width styles
function MobileNavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block w-full px-4 py-3 rounded-xl font-medium transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-[#334578] hover:bg-gray-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
