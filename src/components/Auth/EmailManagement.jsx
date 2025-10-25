import { useState } from "react";
import { changeEmail, resendVerification } from "../../services/userService";
import "../style/AuthPage.css";
import "../style/EmailManagement.css";

const EmailManagement = ({ currentEmail, onClose }) => {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!newEmail) {
      setError("New email is required");
      return;
    }

    if (newEmail === currentEmail) {
      setError("New email must be different from current email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      await changeEmail({ newEmail });

      setMessage(
        "Verification email sent to your new email address. Please check your inbox and spam folder."
      );
      setNewEmail("");
      setTimeout(() => {
        onClose?.();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);

      await resendVerification();
      setMessage("Verification email sent successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-management-modal">
      <div className="email-management-content">
        <div className="email-management-header">
          <h2>Email Management</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="email-management-body">
          {/* Current Email */}
          <div className="current-email-section">
            <h3>Current Email</h3>
            <div className="current-email-display">
              <span className="email-text">{currentEmail}</span>
              <span className="verified-badge">✓ Verified</span>
            </div>
          </div>

          {/* Change Email Form */}
          <form onSubmit={handleSubmit} className="change-email-form">
            <h3>Change Email Address</h3>
            <p className="form-description">
              Enter your new email address. We'll send a verification link to
              confirm the change.
            </p>

            <div className="form-group">
              <label htmlFor="newEmail">New Email Address</label>
              <input
                type="email"
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                required
              />
            </div>

            {/* Messages */}
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {/* Buttons */}
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Change Email"}
              </button>
            </div>
          </form>

          {/* Resend Verification */}
          <div className="resend-verification-section">
            <h3>Resend Verification</h3>
            <p className="form-description">
              Didn't receive the verification email? Click below to resend it.
            </p>
            <button
              className="resend-btn"
              onClick={handleResendVerification}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;
