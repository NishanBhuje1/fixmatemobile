import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, HeartHandshake, ArrowRight, MapPin, Store } from "lucide-react";

export default function Welcome() {
  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#f1f9f8]">
      {/* 1. Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl mx-auto px-4 py-12">
        {/* 2. Glassmorphism Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-blue-900/5 p-8 md:p-12 overflow-hidden"
        >
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <motion.div variants={itemVariants}>
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-4">
                FixMate Mobile • In-Store Repairs
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-serif text-[#334578] tracking-tight mb-6"
            >
              Repair made{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                simple
              </span>
              .
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[#334578]/70 text-lg md:text-xl leading-relaxed"
            >
              We’re a local repair shop and all services are performed{" "}
              <span className="font-semibold text-[#334578]">on-site at our physical store</span>.
              Get a quick estimate online, then visit us for inspection and repair.
            </motion.p>
          </div>

          {/* Policy Clarity Banner */}
          <motion.div
            variants={itemVariants}
            className="mb-10 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Store className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#334578]">
                  In-store service only
                </p>
                <p className="text-sm text-[#334578]/75 mt-1">
                  We are not a third-party remote support provider. Repairs are an additional service for our customers and are
                  completed at our shop after device inspection.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-[#334578]/80">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    K129/175 Maroondah Highway, Ringwood, VIC 3134
                  </span>
                  <span className="hidden sm:inline text-[#334578]/40">•</span>
                  <span>(03) 8820 8183</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-6 mb-12">
            <FeatureCard
              icon={<HeartHandshake className="w-6 h-6 text-blue-600" />}
              title="Friendly In-Store Support"
              desc="Clear advice and honest recommendations in person—no jargon."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
              title="On-Site Repairs"
              desc="Repairs are carried out at our Ringwood store after inspection."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Fast & Simple"
              desc="Get an estimate online, then book and visit the store."
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/quote"
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[#334578] rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/30 hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Quote NOW! <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </Link>

            <Link
              to="/visit-store"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-[#334578] bg-white border border-gray-200 rounded-full transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
            >
              Visit Our Store
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-[#334578] bg-white border border-gray-200 rounded-full transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
            >
              Contact Us
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Sub-component for cleaner code
function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
      }}
      whileHover={{ y: -5 }}
      className="group p-6 bg-white/50 rounded-2xl border border-white/60 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-[#334578] mb-2">{title}</h3>
      <p className="text-[#334578]/70 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
