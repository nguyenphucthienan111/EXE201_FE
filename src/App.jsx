import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer";

// Trang Home
import Home from "../src/components/Home/Home";

// Các trang khác
import Contact from "../src/components/Contact/Contact";
import About from "../src/components/About/About";
import LoginPage from "../src/components/Auth/LoginPage"; // nhớ import LoginPage mới
import JournalEntriesPage from "../src/components/Journaling/JournalEntriesPage"; // ⭐ import trang JournalEntriesPage
import TemplateChooser from "./components/Journaling/TemplateChooser";
import PremiumPage from "./components/Premium/PremiumPage";
import PaymentCancel from "./components/Premium/PaymentCancel";
import PaymentSuccess from "./components/Premium/PaymentSuccess";
import VerifyEmail from "./components/Auth/VerifyEmail";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import ChangePassword from "./components/Auth/ChangePassword";
import ProfilePage from "./components/Auth/ProfilePage";
import JournalDashboardPage from "./components/Journaling/JournalDashboardPage";
import Logout from "./components/Auth/Logout";

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
        <Route path="/verify" element={<VerifyEmail />} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/reset-password" element={<ResetPassword />} />
         <Route path="/change-password" element={<ChangePassword />} />
         <Route path="/profile" element={<ProfilePage />} />
         <Route path="/logout" element={<Logout />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
         <Route path="/payment/cancel" element={<PaymentCancel />} />
        
       {/* Journal */}
        <Route path="/journal" element={<JournalEntriesPage />} />
        <Route path="/journals/dashboard" element={<JournalDashboardPage />} />
        <Route path="/journal/templates" element={<TemplateChooser />} />
        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
}
