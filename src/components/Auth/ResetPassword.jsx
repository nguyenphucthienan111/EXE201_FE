import { useState } from "react";
import { resetPassword } from "../../services/authService";
import "../style/AuthPage.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); 
    setErr("");
    try {
      setLoading(true);
      const data = await resetPassword({ email, code, newPassword: pw });
      setMsg(data?.message || "Password updated. You can log in now.");
      setEmail("");
      setCode("");
      setPw("");
    } catch (error) {
      const m =
        error?.response?.data?.message ||
        error?.message ||
        "Reset failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>Reset Password</h1>
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

export default ResetPassword;
