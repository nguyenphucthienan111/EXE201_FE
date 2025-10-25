import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  getMyStats,
} from "../../services/userService";
import ChangePassword from "./ChangePassword";
import EmailManagement from "./EmailManagement";
import AvatarUpload from "./AvatarUpload";
import SuccessNotification from "../common/SuccessNotification";
import "../style/AuthPage.css";
import "../style/ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEmailManagement, setShowEmailManagement] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // Success notification
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        setProfile(me);
        setName(me?.name || "");
        const s = await getMyStats();
        setStats(s);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      setLoading(true);
      await updateMyProfile({ name });
      const me = await getMyProfile(); // refresh view
      setProfile(me);

      // Show success notification
      setSuccessMessage("Profile updated successfully!");
      setShowSuccessNotification(true);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("This will delete your account and ALL data. Continue?"))
      return;
    try {
      await deleteMyAccount();

      // Show success notification before redirect
      setSuccessMessage("Account deleted successfully. Redirecting...");
      setShowSuccessNotification(true);

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="auth-root">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar"
              key={profile?.avatar || "no-avatar"}
            >
              {profile?.avatar && profile.avatar.trim() !== "" ? (
                <div style={{ position: "relative", zIndex: 10 }}>
                  <img
                    key={profile.avatar} // Force re-render when avatar changes
                    src={profile.avatar}
                    alt="Profile"
                    className="avatar-image"
                    style={{
                      display: "block",
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid #6f5aa7",
                      boxShadow: "0 8px 32px rgba(111, 90, 167, 0.3)",
                    }}
                  />
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <span>👤</span>
                </div>
              )}
            </div>
            <button
              className="change-avatar-btn"
              onClick={() => setShowAvatarUpload(true)}
            >
              📷 Change Photo
            </button>
          </div>

          <div className="profile-info">
            <h1>My Profile</h1>
            {profile && (
              <div className="profile-details">
                <div className="profile-detail">
                  <span className="label">Email:</span>
                  <span className="value">{profile.email}</span>
                </div>
                <div className="profile-detail">
                  <span className="label">Plan:</span>
                  <span className={`plan-badge ${profile.plan}`}>
                    {profile.plan || "free"}
                  </span>
                </div>
                <div className="profile-detail">
                  <span className="label">Status:</span>
                  <span
                    className={`status-badge ${
                      profile.isEmailVerified ? "verified" : "unverified"
                    }`}
                  >
                    {profile.isEmailVerified ? "✓ Verified" : "⚠ Unverified"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Basic Information */}
          <div className="profile-section">
            <h2>Basic Information</h2>
            <form onSubmit={onSave} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  className="auth-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Security Settings */}
          <div className="profile-section">
            <h2>Security</h2>
            <div className="profile-actions">
              <button
                className="action-btn password-btn"
                onClick={() => setShowChangePassword(true)}
              >
                🔐 Change Password
              </button>
              <button
                className="action-btn email-btn"
                onClick={() => setShowEmailManagement(true)}
              >
                📧 Manage Email
              </button>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="profile-section">
              <h2>Your Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalJournals || 0}</div>
                  <div className="stat-label">Journals</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {stats?.premiumDaysLeft || 0}
                  </div>
                  <div className="stat-label">Premium Days Left</div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="profile-section danger-zone">
            <h2>Danger Zone</h2>
            <p className="danger-warning">
              These actions are irreversible. Please proceed with caution.
            </p>
            <button className="danger-btn" onClick={onDelete}>
              🗑️ Delete My Account
            </button>
          </div>
        </div>

        {/* Messages */}
        {err && <div className="auth-notice error">{err}</div>}
        {msg && <div className="auth-notice success">{msg}</div>}
      </div>

      {/* Modals */}
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}

      {showEmailManagement && (
        <EmailManagement
          currentEmail={profile?.email}
          onClose={() => setShowEmailManagement(false)}
        />
      )}

      {showAvatarUpload && (
        <AvatarUpload
          currentAvatar={profile?.avatar}
          onClose={() => setShowAvatarUpload(false)}
          onAvatarUpdated={async () => {
            try {
              const me = await getMyProfile();
              setProfile(me);
            } catch (err) {
              console.error("Error refreshing profile:", err);
            }
          }}
        />
      )}

      {/* Success Notification */}
      <SuccessNotification
        isVisible={showSuccessNotification}
        message={successMessage}
        onClose={() => setShowSuccessNotification(false)}
      />
    </div>
  );
}
