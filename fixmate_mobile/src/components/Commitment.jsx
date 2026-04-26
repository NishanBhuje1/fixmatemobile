import { motion } from "framer-motion";
import {
  Star,
  ShieldCheck,
  Wrench,
  HeartHandshake,
  Quote,
  Store,
} from "lucide-react";

// --- Review Data (Static for now) ---
const REVIEWS = [
  {
    name: "Nishan Bhujel",
    text: "I had a great experience at this mobile repair shop. The staff were professional, knowledgeable, efficient. Pricing was fair, and the turnaround time was faster than expected.",
    stars: 5,
  },
  {
    name: "Josephine Flecknoe",
    text: "Very helpful and trustworthy service from the salesperson, plus great product knowledge. Thanks Wayne.",
    stars: 5,
  },
  {
    name: "Neil Fereday",
    text: "Great service and plenty of choice. Highly recommended!",
    stars: 5,
  },
  {
    name: "Daya shankar Pathak",
    text: "Good Service and very professional.",
    stars: 5,
  },
];

export default function Commitment() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-[#f1f9f8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PART 1: OUR COMMITMENT (Split Layout) */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6">
              <Store className="w-4 h-4" /> In-Store Services
            </div>

            <h2 className="text-4xl md:text-5xl font-serif text-[#334578] mb-6 leading-tight">
              Your local <span className="text-blue-600">retail store</span> for
              phones, accessories, and in-store device services
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              FixMate Mobile is a physical store. We sell mobile accessories and
              provide optional, in-store device services such as screen and
              battery replacements, hardware servicing, and
              diagnostics—performed on-site at our location.
            </p>

            {/* Policy clarity (key for Google Ads) */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 mb-8">
              <p className="text-sm text-[#334578] font-semibold">Important:</p>
              <p className="text-sm text-[#334578]/80 leading-relaxed">
                All services are performed <strong>in-store</strong> at our
                physical location. We do not provide remote, online-only, or
                third-party technical support.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <FeatureItem
                icon={<Wrench />}
                text="On-site device servicing (screen, battery, ports, diagnostics)"
              />
              <FeatureItem
                icon={<ShieldCheck />}
                text="Quality parts, clear pricing & workmanship warranty"
              />
              <FeatureItem
                icon={<HeartHandshake />}
                text="Friendly in-store help for choosing accessories and services"
              />
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-600 rounded-3xl rotate-3 opacity-10"></div>
            <img
              src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=2070&auto=format&fit=crop"
              alt="In-store technician servicing a phone"
              className="relative rounded-3xl shadow-2xl w-full object-cover h-[400px] md:h-[500px]"
            />
          </motion.div>
        </div>

        {/* PART 2: TESTIMONIALS */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-serif text-[#334578] mb-4">
              Trusted by local customers
            </h3>
            <div className="flex justify-center items-center gap-2 text-amber-500 mb-2">
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
            </div>
            <p className="text-gray-500">Based on our Google Reviews</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REVIEWS.map((review, i) => (
              <ReviewCard key={i} review={review} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Sub-components ---

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <span className="text-[#334578] font-medium">{text}</span>
    </div>
  );
}

function ReviewCard({ review, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow"
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4 text-amber-400">
        {[...Array(review.stars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current" />
        ))}
      </div>

      {/* Quote Icon */}
      <div className="mb-4">
        <Quote className="w-8 h-8 text-blue-100 fill-current" />
      </div>

      {/* Text */}
      <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
        "{review.text}"
      </p>

      {/* Author */}
      <div className="mt-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          {review.name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-bold text-[#334578]">{review.name}</div>
          {/* review.date removed because it was undefined and could show blank */}
        </div>
      </div>
    </motion.div>
  );
}
