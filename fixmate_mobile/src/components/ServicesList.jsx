import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Wrench } from "lucide-react";

// Service Data (Same images)
const SERVICES = [
  {
    title: "Screen Replacement",
    desc: "Cracked screen, touch issues, display not working.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Battery Replacement",
    desc: "Battery draining fast, phone shutting down, swelling.",
    image: "https://images.unsplash.com/photo-1525446517618-9a9e5430288b?q=80&w=1430&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Charging Port Repair",
    desc: "Loose cable, not charging, intermittent charging.",
    image: "https://images.unsplash.com/photo-1741144837506-9986b01d8e27?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Camera Repair",
    desc: "Blurry camera, black screen, focus issues.",
    image: "https://images.unsplash.com/photo-1608540784621-e66c96a3271f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Water Damage Check",
    desc: "Inspection and cleaning to prevent corrosion.",
    image: "https://images.unsplash.com/photo-1550253594-4a24acce57eb?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Speaker / Microphone",
    desc: "Low sound, no audio, mic not working during calls.",
    image: "https://plus.unsplash.com/premium_vector-1683141463858-66d21bf627d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGlwaG9uZXxlbnwwfHwwfHx8MA%3D%3D",
  },
];

export default function ServicesList() {
  const navigate = useNavigate();

  function goToQuote(serviceTitle) {
    navigate(`/quote?issue=${encodeURIComponent(serviceTitle)}`);
  }

  return (
    <section className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Wrench className="w-4 h-4" /> Our Expertise
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-serif text-[#334578] mb-4 md:mb-6"
          >
            Services We Provide
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#334578]/70 text-base md:text-lg"
          >
            Select a service below to get an instant quote.
          </motion.p>
        </div>

        {/* Services Grid - Optimized for Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {SERVICES.map((s, index) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.button
                onClick={() => goToQuote(s.title)}
                whileTap={{ scale: 0.96 }} // Adds a satisfying "click" feel on touch
                whileHover={{ y: -5 }} // Hover effect for desktop
                className="group relative w-full h-64 md:h-80 rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${s.image})` }}
                />

                {/* Permanent Gradient Overlay (Readability) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent opacity-90" />

                {/* Content Container */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-left">
                  
                  {/* Title & Icon Row */}
                  <div className="flex justify-between items-end mb-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight pr-4">
                      {s.title}
                    </h3>
                    
                    {/* Circle Icon - Visual cue to tap */}
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white shrink-0 group-hover:bg-blue-600 transition-colors">
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>

                  {/* Description - Always visible for UX */}
                  <p className="text-gray-300 text-sm leading-snug md:leading-relaxed line-clamp-2">
                    {s.desc}
                  </p>
                  
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}