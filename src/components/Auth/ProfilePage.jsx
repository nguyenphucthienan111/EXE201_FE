import { useEffect, useState, useCallback } from "react";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  getMyStats,
} from "../../services/userService";
import {
  getTemplates,
  uploadTemplate,
  deleteTemplate,
} from "../../services/templateService";
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

  const [userTemplates, setUserTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState("");
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateUploadError, setTemplateUploadError] = useState("");
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [templatePendingDelete, setTemplatePendingDelete] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [templateDeleteError, setTemplateDeleteError] = useState("");

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

  const loadUserTemplates = useCallback(async () => {
    if (!profile?.plan || profile.plan !== "premium") {
      setUserTemplates([]);
      return;
    }

    setTemplatesLoading(true);
    setTemplatesError("");
    try {
      const res = await getTemplates();
      const list = Array.isArray(res?.list) ? res.list : [];
      const mine = list.filter((tpl) => tpl.category === "user");
      setUserTemplates(mine);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load templates.";
      setTemplatesError(message);
      setUserTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [profile?.plan]);

  useEffect(() => {
    loadUserTemplates();
  }, [loadUserTemplates]);

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

  const resetTemplateModal = () => {
    setTemplateName("");
    setTemplateDescription("");
    setTemplateFile(null);
    setTemplatePreview("");
    setTemplateUploadError("");
  };

  const openTemplateModal = () => {
    resetTemplateModal();
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    resetTemplateModal();
  };

  const handleTemplateFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setTemplateFile(file || null);
    setTemplateUploadError("");

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTemplatePreview(reader.result?.toString() || "");
      };
      reader.readAsDataURL(file);
    } else {
      setTemplatePreview("");
    }
  };

  const handleTemplateUpload = async (event) => {
    event.preventDefault();
    setTemplateUploadError("");

    if (!templateName.trim()) {
      setTemplateUploadError("Template name is required.");
      return;
    }

    if (!templateFile) {
      setTemplateUploadError("Please select an image file for the template.");
      return;
    }

    setUploadingTemplate(true);
    try {
      await uploadTemplate({
        name: templateName.trim(),
        description: templateDescription,
        file: templateFile,
      });

      setSuccessMessage("Template uploaded successfully!");
      setShowSuccessNotification(true);
      closeTemplateModal();
      await loadUserTemplates();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload template.";
      setTemplateUploadError(message);
    } finally {
      setUploadingTemplate(false);
    }
  };

  const openDeleteTemplateModal = (template) => {
    setTemplatePendingDelete(template);
    setTemplateDeleteError("");
    setShowDeleteTemplateModal(true);
  };

  const closeDeleteTemplateModal = () => {
    if (deletingTemplate) return;
    setTemplatePendingDelete(null);
    setTemplateDeleteError("");
    setShowDeleteTemplateModal(false);
  };

  const handleDeleteTemplate = async () => {
    if (!templatePendingDelete?.id) return;
    setDeletingTemplate(true);
    try {
      await deleteTemplate(templatePendingDelete.id);
      setSuccessMessage("Template deleted successfully.");
      setShowSuccessNotification(true);
      closeDeleteTemplateModal();
      await loadUserTemplates();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete template.";
      setTemplateDeleteError(message);
    } finally {
      setDeletingTemplate(false);
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
                    key={profile.avatar}
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

          {/* Premium Template Management */}
          {profile?.plan === "premium" ? (
            <div className="profile-section premium-template-section">
              <div className="template-header">
                <h2>My Premium Templates</h2>
                <button
                  className="template-upload-btn"
                  onClick={openTemplateModal}
                >
                  ➕ Upload Template
                </button>
              </div>
              <p className="template-hint">
                Upload custom backgrounds to reuse across your journals. Only
                you can see and use these templates.
              </p>

              {templatesError && (
                <div className="template-error">{templatesError}</div>
              )}

              {templatesLoading ? (
                <div className="template-loading">
                  Loading your templates...
                </div>
              ) : userTemplates.length === 0 ? (
                <div className="template-empty">
                  <div>🚀 No custom templates yet.</div>
                  <div>
                    Click “Upload Template” to add your first background.
                  </div>
                </div>
              ) : (
                <div className="template-grid-scroll">
                  <div className="template-grid">
                    {userTemplates.map((tpl) => (
                      <div className="template-card" key={tpl.id}>
                        <div className="template-thumb">
                          {tpl.imageUrl ? (
                            <img
                              src={tpl.imageUrl}
                              alt={tpl.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="template-thumb-fallback" />
                          )}
                        </div>
                        <div className="template-info">
                          <div className="template-name">{tpl.name}</div>
                          {tpl.description && (
                            <div className="template-description">
                              {tpl.description}
                            </div>
                          )}
                        </div>
                        <div className="template-actions">
                          <button
                            type="button"
                            className="template-delete-btn"
                            onClick={() => openDeleteTemplateModal(tpl)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="profile-section premium-template-upsell">
              <h2>Premium Templates</h2>
              <p>
                Upgrade to Premium to upload your own journal backgrounds and
                unlock extra template designs tailored to your mood.
              </p>
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

              // Update user data in localStorage for header
              const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
              );
              const updatedUser = { ...currentUser, avatar: me.avatar };
              localStorage.setItem("user", JSON.stringify(updatedUser));

              // Dispatch event to refresh header
              window.dispatchEvent(new CustomEvent("auth:changed"));
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

      {/* Upload Template Modal */}
      {showTemplateModal && (
        <div className="modal-backdrop" onClick={closeTemplateModal}>
          <div
            className="modal template-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Upload Premium Template</h3>
            <form className="template-form" onSubmit={handleTemplateUpload}>
              <label className="modal-label">
                Template Name
                <input
                  className="modal-input"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Sunset Reflections"
                  maxLength={80}
                  required
                />
              </label>

              <label className="modal-label">
                Description{" "}
                <span className="modal-label-optional">(optional)</span>
                <textarea
                  className="modal-textarea"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  maxLength={240}
                  placeholder="A warm orange and gold gradient for evening reflections."
                />
              </label>

              <label className="modal-label">
                Template Image
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  onChange={handleTemplateFileChange}
                  required
                />
              </label>

              {templatePreview && (
                <div className="template-preview">
                  <img src={templatePreview} alt="Preview" />
                </div>
              )}

              {templateUploadError && (
                <div className="template-error">{templateUploadError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn ghost"
                  onClick={closeTemplateModal}
                >
                  Cancel
                </button>
                <button className="modal-btn" disabled={uploadingTemplate}>
                  {uploadingTemplate ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteTemplateModal && (
        <div className="modal-backdrop" onClick={closeDeleteTemplateModal}>
          <div
            className="modal template-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Delete template?</h3>
            <p className="modal-confirm-text">
              Are you sure you want to delete "{templatePendingDelete?.name}"?
              This action cannot be undone.
            </p>
            {templateDeleteError && (
              <div className="template-error" style={{ marginBottom: 16 }}>
                {templateDeleteError}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn ghost"
                onClick={closeDeleteTemplateModal}
                disabled={deletingTemplate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn danger"
                onClick={handleDeleteTemplate}
                disabled={deletingTemplate}
              >
                {deletingTemplate ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
