import { useState } from "react";
import { changePassword } from "../../services/authService";
import "../style/AuthPage.css";

const ChangePassword = () => {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); 
    setErr("");

    if (newPw !== confirmPw) {
      setErr("Password confirmation does not match.");
      return;
    }

    try {
      setLoading(true);
      const data = await changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setMsg(data?.message || "Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (error) {
      const m =
        error?.response?.data?.message ||
        error?.message ||
        "Change password failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>Change Password</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="password"
            placeholder="Current password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="New password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {err && <div className="auth-notice error">{err}</div>}
        {msg && <div className="auth-notice success">{msg}</div>}

        <div className="auth-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
