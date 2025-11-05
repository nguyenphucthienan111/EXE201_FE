// src/components/Admin/AdminTemplatesPage.jsx
import { useState, useEffect, useMemo } from "react";
import {
  uploadAdminTemplate,
  getAdminTemplates,
  deleteAdminTemplate,
  toggleAdminTemplateStatus,
} from "../../services/adminTemplateService";
import "../style/AdminTemplate.css";

/** Chuẩn hoá mọi kiểu response thành mảng templates */
function pickTemplates(payload) {
  const candidates = [
    payload?.data?.data?.templates,
    payload?.data?.templates,
    payload?.templates,
    payload?.data,
    payload,
  ];
  const arr = candidates.find((x) => Array.isArray(x));
  return Array.isArray(arr) ? arr : [];
}

/** Trích URL ảnh từ nhiều kiểu field khác nhau */
function pickImageField(tpl) {
  return (
    tpl?.thumbnail ||
    tpl?.thumb ||
    tpl?.preview ||
    tpl?.previewUrl ||
    tpl?.imageUrl ||
    tpl?.image ||
    tpl?.templateUrl ||
    tpl?.template ||
    null
  );
}

/** Chuẩn hoá thành absolute URL để <img> dùng được */
function toAbsoluteUrl(maybeUrl, HOST) {
  if (!maybeUrl) return null;
  if (typeof maybeUrl !== "string") return null;

  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  if (/^blob:/.test(maybeUrl)) return maybeUrl;
  if (maybeUrl.startsWith("/")) return HOST + maybeUrl;
  return HOST + "/" + maybeUrl;
}

/** Tối ưu URL Cloudinary: tự động định dạng + nén + resize để load nhanh */
function optimizeCloudinary(
  url,
  { w = 240, h = 180, crop = "fill", gravity = "auto" } = {}
) {
  if (!url || typeof url !== "string") return url;
  // Chỉ áp dụng cho Cloudinary
  if (!/https?:\/\/res\.cloudinary\.com\//.test(url)) return url;
  // Nếu đã có tham số transform thì giữ nguyên
  if (/\/upload\/(?:v\d+\/)?(f_auto|q_auto|w_|h_|c_|g_)/.test(url)) return url;
  // Chèn tham số sau /upload/
  return url.replace(
    /\/upload\//,
    `/upload/f_auto,q_auto,w_${w},h_${h},c_${crop},g_${gravity}/`
  );
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "default",
  });

  // ui state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const HOST = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), [API_BASE]);

  async function loadTemplates() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getAdminTemplates();
      const list = pickTemplates(res);
      setTemplates(list);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to fetch templates"
      );
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      await uploadAdminTemplate({
        name: form.name,
        description: form.description,
        category: form.category,
        file,
      });

      setSuccess("Template uploaded successfully!");
      setForm({ name: "", description: "", category: "default" });
      setFile(null);
      await loadTemplates();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    }
  }

  async function handleDelete(templateId) {
    if (!window.confirm("Are you sure you want to delete this template?"))
      return;
    try {
      await deleteAdminTemplate(templateId);
      setSuccess("Template deleted successfully!");
      await loadTemplates();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    }
  }

  async function handleToggle(templateId) {
    try {
      await toggleAdminTemplateStatus(templateId);
      setSuccess("Template status updated!");
      await loadTemplates();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Toggle failed");
    }
  }

  return (
    <div className="ad-content">
      {/* Panel Upload */}
      <div className="ad-panel">
        <div className="ad-panel-head">
          <h2>Admin Templates</h2>
        </div>

        <form className="admin-form" onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            className="admin-select"
          >
            <option value="default">Default (Free users)</option>
            <option value="premium">Premium</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />

          <button type="submit" className="ad-btn">
            Upload Template
          </button>
        </form>

        {error && (
          <div className="ad-alert error" style={{ marginTop: 10 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="ad-alert" style={{ marginTop: 10 }}>
            {success}
          </div>
        )}
      </div>

      {/* Panel List */}
      <div className="ad-panel" style={{ marginTop: 18 }}>
        <div className="ad-panel-head">
          <h2>All Templates</h2>
          <button className="ad-btn" onClick={loadTemplates} disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </button>
        </div>

        {loading ? (
          <div className="ad-skeleton">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="ad-empty">No templates found.</div>
        ) : (
          <div className="template-list">
            {templates.map((tpl, i) => {
              const rawImg = pickImageField(tpl);
              const abs = toAbsoluteUrl(rawImg, HOST);
              const img = optimizeCloudinary(abs, { w: 240, h: 180 });
              const cat = (tpl.category || "default").toString().toLowerCase();

              return (
                <div
                  key={tpl._id || tpl.id || i}
                  className="template-card"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "88px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 88,
                      height: 66,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#f3f4f6",
                      border: "1px solid #eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        loading="lazy"
                        decoding="async"
                        width={88}
                        height={66}
                        alt={tpl.name || "Template"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.textContent =
                            "No image";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        No image
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 style={{ margin: 0 }}>{tpl.name || "Untitled"}</h3>
                    <p style={{ margin: "4px 0 6px", color: "#4b5563" }}>
                      {tpl.description || "—"}
                    </p>
                    <small
                      style={{
                        color: "#6b7280",
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: cat === "premium" ? "#fde2ff" : "#e9e7ff",
                      }}
                    >
                      {cat}
                    </small>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: tpl.isActive ? "green" : "red",
                        }}
                      >
                        {tpl.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="ad-btn"
                      style={{ background: "#f87171" }}
                      onClick={() => handleDelete(tpl._id || tpl.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="ad-btn"
                      style={{ background: "#60a5fa" }}
                      onClick={() => handleToggle(tpl._id || tpl.id)}
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
