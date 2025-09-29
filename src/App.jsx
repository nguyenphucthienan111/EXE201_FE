import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer";

// Trang Home
import Home from "../src/components/Home/Home";

// Các trang khác
import Contact from "../src/components/Contact/Contact";
import About from "../src/components/About/About";
import LoginPage from "../src/components/Auth/LoginPage"; // nhớ import LoginPage mới

import "./App.css";

export default function App() {
  const location = useLocation();

  // Những path không cần Header/Footer
  const noLayoutPaths = ["/login"];

  const hideLayout = noLayoutPaths.includes(location.pathname);

  return (
    <>
      {!hideLayout && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
}
