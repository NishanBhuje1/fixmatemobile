import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-[#f1f9f8] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#334578] leading-tight mb-6">
              Expert Care for Your Device
            </h1>
            <p className="text-xl md:text-2xl text-[#334578] mb-8">
              Your Trusted Phone Partner
            </p>

            <button
              onClick={() => navigate("/quote")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors"
            >
              Get Quote NOW!
            </button>
          </div>

          {/* Right Image */}
          <div className="flex-1 w-full">
            <img
              src="https://ext.same-assets.com/657843969/818504829.jpeg"
              alt="Phone repair tools and disassembled phone"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
      {/* Call Button */}
      <a
        href="tel:0388208183"
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-4 md:px-6 md:py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors z-40"
        aria-label="Call us"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
        {/* Text is hidden on mobile, visible on medium screens and up */}
        <span className="hidden md:block">(03) 8820 8183</span>
      </a>
    </section>
  );
}
