import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/authService";
import "../style/AuthPage.css";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // step: "request" (gửi mail) | "reset" (nhập code + đặt mật khẩu)
  const [step, setStep] = useState("request");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Bước 1: gửi mã reset
  const handleSend = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    try {
      setLoading(true);
      const data = await forgotPassword(email);
      setMsg(data?.message || "Reset code sent. Check your email.");
      setStep("reset"); // sang bước nhập code + mật khẩu mới
    } catch (error) {
      const m = error?.response?.data?.message || error?.message || "Request failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã
  const handleResend = async () => {
    setErr(""); setMsg("");
    try {
      setResending(true);
      const data = await forgotPassword(email);
      setMsg(data?.message || "Code resent. Check your email.");
    } catch (error) {
      const m = error?.response?.data?.message || error?.message || "Resend failed.";
      setErr(m);
    } finally {
      setResending(false);
    }
  };

  // Bước 2: đặt lại mật khẩu
  const handleReset = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    try {
      setLoading(true);
      const payload = { email, code: code.trim().toUpperCase(), newPassword: pw };
      const data = await resetPassword(payload);

      setMsg(data?.message || "Password updated. You can log in now.");
      setCode(""); setPw("");

      // ✅ tự chuyển về trang login sau 1 giây
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      const m = error?.response?.data?.message || error?.message || "Reset failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>Forgot Password</h1>

        {step === "request" && (
          <form onSubmit={handleSend}>
            <input
              className="auth-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset}>
            <input className="auth-input" type="email" value={email} disabled />
            <input
              className="auth-input"
              type="text"
              placeholder="Reset code"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="New password"
              value={pw}
              onChange={(e)=>setPw(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="auth-btn"
              style={{ marginTop: 10, background: "#6f5aa7" }}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </form>
        )}

        {err && <div className="auth-notice error">{err}</div>}
        {msg && <div className="auth-notice success">{msg}</div>}

        <div className="auth-link">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
