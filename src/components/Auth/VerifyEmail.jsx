import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../services/authService";
import "../style/AuthPage.css";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const VerifyEmail = () => {
  const q = useQuery();
  const navigate = useNavigate();

  const [email, setEmail] = useState(q.get("email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Lấy email từ localStorage nếu chưa có trên URL
  useEffect(() => {
    if (!email) {
      const pending = localStorage.getItem("pending_verify_email");
      if (pending) setEmail(pending);
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!email || !code) {
      setErr("Please enter both email and verification code.");
      return;
    }

    try {
      setLoading(true);
      const data = await verifyEmail({ email, code });
      setMsg(data?.message || "Verified successfully! You can log in now.");
      localStorage.removeItem("pending_verify_email");
      setCode("");
      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      const m =
        error?.response?.data?.message ||
        error?.message ||
        "Verification failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>Verify your email</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Verification code"
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {err && <div className="auth-notice error">{err}</div>}
        {msg && <div className="auth-notice success">{msg}</div>}

        <div className="auth-link">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
