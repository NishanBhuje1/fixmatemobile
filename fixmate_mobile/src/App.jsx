import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import ServicesList from "./components/ServicesList";
import Commitment from "./components/Commitment";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import VisitStore from "./pages/VisitStore";
import Quote from "./pages/Quote";
import CustomQuote from "./pages/CustomQuote";
import Welcome from "./pages/Welcome";
import Contact from "./pages/Contact";

function HomePage() {
  return (
    <>
      <Hero />
      <ServicesList />
      <Commitment />
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/visit-store" element={<VisitStore />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/custom-quote" element={<CustomQuote />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
