import { useState, useRef } from "react";
import { uploadAvatar, removeAvatar } from "../../services/userService";
import "../style/AuthPage.css";
import "../style/AvatarUpload.css";

const AvatarUpload = ({ currentAvatar, onClose, onAvatarUpdated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentAvatar || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await uploadAvatar(selectedFile);

      setMessage("Avatar updated successfully!");

      // Notify parent component to refresh profile data
      onAvatarUpdated?.();

      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await removeAvatar();

      setMessage("Avatar removed successfully!");
      setPreview(null);
      setSelectedFile(null);

      // Notify parent component to refresh profile data
      onAvatarUpdated?.();

      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove avatar");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Function to truncate filename
  const truncateFilename = (filename, maxLength = 30) => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.split(".").pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 4
    );

    return `${truncatedName}...${extension}`;
  };

  return (
    <div className="avatar-upload-modal">
      <div className="avatar-upload-content">
        <div className="avatar-upload-header">
          <h2>Profile Picture</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="avatar-upload-body">
          {/* Current Avatar Preview */}
          <div className="avatar-preview-section">
            <h3>Preview</h3>
            <div className="avatar-preview">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <span>👤</span>
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="file-upload-section">
            <h3>Upload New Picture</h3>
            <p className="upload-description">
              Choose an image file (JPG, PNG, GIF). Maximum size: 5MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <button
              className="select-file-btn"
              onClick={triggerFileSelect}
              disabled={loading}
            >
              📁 Choose File
            </button>

            {selectedFile && (
              <div className="selected-file-info">
                <span title={selectedFile.name}>
                  Selected: {truncateFilename(selectedFile.name)}
                </span>
                <span className="file-size">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {/* Actions */}
          <div className="avatar-actions">
            <button
              className="remove-btn"
              onClick={handleRemoveAvatar}
              disabled={loading || !preview}
            >
              🗑️ Remove Avatar
            </button>

            <div className="action-buttons">
              <button
                className="cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="upload-btn"
                onClick={handleUpload}
                disabled={loading || !selectedFile}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;
