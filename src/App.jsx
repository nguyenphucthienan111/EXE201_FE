import { Routes, Route } from "react-router-dom";

import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer";

// Trang Home ghép các section sẵn có
import Home from "../src/components/Home/Home";

// Các trang khác (tạo file rỗng trước cũng được)


import Contact from "../src/components/Contact/Contact";
import About from "../src/components/About/About";


import "./App.css";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />

       
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
    

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Routes>
      <Footer />
    </>
  );
}
