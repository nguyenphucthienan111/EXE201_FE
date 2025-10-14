import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Header from "./components/Home/Header";
import Footer from "./components/Home/Footer";

import Home from "./components/Home/Home";
import Contact from "./components/Contact/Contact";
import About from "./components/About/About";
import LoginPage from "./components/Auth/LoginPage";
import VerifyEmail from "./components/Auth/VerifyEmail";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import ChangePassword from "./components/Auth/ChangePassword";
import ProfilePage from "./components/Auth/ProfilePage";
import ReviewsPage from "./components/Reviews/ReviewsPage";
import Logout from "./components/Auth/Logout";

import PremiumPage from "./components/Premium/PremiumPage";
import PaymentCancel from "./components/Premium/PaymentCancel";
import PaymentSuccess from "./components/Premium/PaymentSuccess";

import JournalEntriesPage from "./components/Journaling/JournalEntriesPage";
import JournalDashboardPage from "./components/Journaling/JournalDashboardPage";
import JournalEditorPage from "./components/Journaling/JournalEditorPage";
import TemplateChooser from "./components/Template/TemplateChooser";
import UploadTemplate from "./components/Template/UploadTemplate";

import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminTemplatesPage from "./components/Admin/AdminTemplatesPage";
import AdminReviewsPage from "./components/Admin/AdminReviewsPage";

import PrivateRoute from "./components/Auth/PrivateRoute";

import "./App.css";

export default function App() {
  const location = useLocation();

  // Ẩn header/footer ở /login và mọi route /admin/*
  const hideLayout =
    location.pathname === "/login" || location.pathname.startsWith("/admin");

  return (
    <>
      {!hideLayout && <Header />}

      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/logout" element={<Logout />} />

        {/* Premium */}
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

        {/* Admin (nested dưới AdminLayout + PrivateRoute) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowRoles={["admin"]}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          {/* khi vào /admin -> render dashboard (có thể đổi thành <Navigate to="dashboard" replace /> nếu muốn) */}
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          {/* fallback trong /admin */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Journal */}
        <Route path="/journal" element={<JournalEntriesPage />} />
        <Route path="/journals/dashboard" element={<JournalDashboardPage />} />
        <Route path="/journal/templates" element={<TemplateChooser />} />
        <Route
          path="/journal/templates/upload"
          element={
            <PrivateRoute allowRoles={["premium", "admin"]}>
              <UploadTemplate />
            </PrivateRoute>
          }
        />
        <Route path="/journals/:id/edit" element={<JournalEditorPage />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}
