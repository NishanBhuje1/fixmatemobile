import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  Store,
  ChevronRight,
  ChevronDown,
  Clock
} from "lucide-react";

// --- Helper: Schedule Data & Logic ---
const SCHEDULE = [
  { day: "Sunday",    open: 10, close: 17, label: "10:00 AM – 5:00 PM" }, // Index 0
  { day: "Monday",    open: 9,  close: 17.5, label: "9:00 AM – 5:30 PM" }, // Index 1
  { day: "Tuesday",   open: 9,  close: 17.5, label: "9:00 AM – 5:30 PM" },
  { day: "Wednesday", open: 9,  close: 17.5, label: "9:00 AM – 5:30 PM" },
  { day: "Thursday",  open: 9,  close: 21,   label: "9:00 AM – 9:00 PM" },
  { day: "Friday",    open: 9,  close: 21,   label: "9:00 AM – 9:00 PM" },
  { day: "Saturday",  open: 9,  close: 17,   label: "9:00 AM – 5:00 PM" },
];

function getStoreStatus() {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon, etc.
  const currentHour = now.getHours() + now.getMinutes() / 60; // Decimal time (e.g., 17.5 = 5:30pm)
  
  const todaySchedule = SCHEDULE[dayIndex];

  if (currentHour >= todaySchedule.open && currentHour < todaySchedule.close) {
    return { 
      isOpen: true, 
      text: `Open until ${todaySchedule.label.split('–')[1].trim()}`,
      color: "green"
    };
  } else {
    // Logic to find next opening time
    let nextDayIndex = (dayIndex + 1) % 7;
    const nextDayName = SCHEDULE[nextDayIndex].day;
    const nextOpenTime = SCHEDULE[nextDayIndex].label.split('–')[0].trim();
    
    return { 
      isOpen: false, 
      text: `Closed • Opens ${nextDayName} ${nextOpenTime}`,
      color: "red"
    };
  }
}

export default function VisitStore() {
  const [status, setStatus] = useState(getStoreStatus());
  const [showHours, setShowHours] = useState(false);

  // Update status every minute to keep it accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getStoreStatus());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 60 } }
  };

  return (
    <div className="min-h-screen bg-[#f1f9f8] text-[#334578] overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        
        {/* --- Header Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div className="space-y-1">
            <Link to="/" className="inline-block md:hidden mb-4">
               <span className="flex items-center text-sm font-semibold text-[#334578]/60 hover:text-[#334578] transition-colors">
                 <ArrowLeft className="w-4 h-4 mr-1" /> Back Home
               </span>
            </Link>
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-[#334578]">
              Visit Our Store
            </h1>
            <p className="text-[#334578]/70 text-base md:text-lg max-w-md">
              Expert repairs and diagnostics, right in the heart of Ringwood.
            </p>
          </div>
          
          <Link to="/" className="hidden md:block">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-2 px-6 py-3 bg-white border border-[#334578]/10 rounded-full shadow-sm hover:shadow-md transition-all font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </motion.button>
          </Link>
        </motion.div>

        {/* --- Main Grid --- */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-12 gap-4 md:gap-6"
        >
          
          {/* LEFT COLUMN: Info & Actions (Span 5) */}
          <div className="lg:col-span-5 space-y-4 md:space-y-6">
            
            {/* Identity Card */}
            <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100/80">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#334578]/5 rounded-2xl flex items-center justify-center text-[#334578]">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">FixMate Mobile</h2>
                  
                  {/* Dynamic Status Badge */}
                  <div className={`flex items-center text-sm font-semibold mt-1 ${status.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="relative flex h-2.5 w-2.5 mr-2">
                      {status.isOpen && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    {status.text}
                  </div>
                </div>
              </div>
              <p className="text-[#334578]/70 text-sm md:text-base leading-relaxed mb-6">
                In-store mobile phone and tablet repairs, diagnostics, and premium accessories. No appointment necessary.
              </p>

              {/* Expandable Hours Section */}
              <div className="border-t border-gray-100 pt-4">
                <button 
                  onClick={() => setShowHours(!showHours)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-[#334578] hover:text-blue-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> View Full Week Hours
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showHours ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showHours && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-4 space-y-2 text-sm text-[#334578]/80">
                        {SCHEDULE.map((item, index) => {
                          const isToday = new Date().getDay() === index;
                          return (
                            <li key={item.day} className={`flex justify-between ${isToday ? 'font-bold text-[#334578]' : ''}`}>
                              <span>{item.day}</span>
                              <span>{item.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Mobile-First Action List */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden divide-y divide-gray-100">
              
              <div className="p-4 hover:bg-gray-50 transition-colors cursor-default group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-semibold text-[#334578]">Address</h3>
                    <p className="text-[#334578]/70 text-sm mt-0.5">
                      Eastland Shopping Centre<br />
                      175 Maroondah Hwy, Ringwood VIC 3134
                    </p>
                  </div>
                </div>
              </div>

              <a href="tel:+61388208183" className="block p-4 hover:bg-gray-50 active:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-semibold text-[#334578]">Call Us</h3>
                    <p className="text-[#334578]/70 text-sm mt-0.5">(03) 8820 8183</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </a>

              <a href="mailto:support@fixmatemobile.com" className="block p-4 hover:bg-gray-50 active:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-semibold text-[#334578]">Email Support</h3>
                    <p className="text-[#334578]/70 text-sm mt-0.5 truncate max-w-[200px] md:max-w-none">
                      support@fixmatemobile.com
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </a>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Map (Span 7) */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-white p-2 rounded-3xl shadow-md border border-gray-100 flex-grow h-full min-h-[300px] md:min-h-[500px] relative group">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200 relative">
                <iframe
                  title="FixMate Mobile Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, width: "100%", height: "100%", minHeight: "300px" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.9432308053047!2d145.22696197735274!3d-37.81479867197537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad63bdd0e4daad1%3A0x894673cf960e4de9!2sFixMate%20Mobile!5e0!3m2!1sen!2sau!4v1768188315044!5m2!1sen!2sau"
                ></iframe>
              </div>

              <div className="absolute bottom-6 right-6 z-10">
                <a
                  href="https://www.google.com/maps/place/FixMate+Mobile/@-37.8147987,145.226962,17z/data=!3m1!4b1!4m6!3m5!1s0x6ad63bdd0e4daad1:0x894673cf960e4de9!8m2!3d-37.8147987!4d145.2295369!16s%2Fg%2F11ypb1mk3g?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                >
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-[#334578] text-white px-5 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                  >
                     Open Maps <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Notices Section --- */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-4 mt-4 md:mt-6"
        >
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex gap-4">
             <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
             <div>
                <h4 className="font-semibold text-[#334578] text-sm mb-1">Independent Provider</h4>
                <p className="text-[#334578]/60 text-xs md:text-sm leading-relaxed">
                  We are an independent repair provider not affiliated with Apple, Samsung, or Google unless explicitly stated.
                </p>
             </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex gap-4">
             <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
             <div>
                <h4 className="font-semibold text-[#334578] text-sm mb-1">Warranty & Quotes</h4>
                <p className="text-[#334578]/60 text-xs md:text-sm leading-relaxed">
                  Issues found during inspection will be communicated before proceeding. Repairs include limited warranty.
                </p>
             </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}