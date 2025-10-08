import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadTemplate } from "../../services/templateService";
import "../style/UploadTemplate.css";

export default function UploadTemplate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    coverUrl: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await uploadTemplate(form);
      setSuccessMsg("Template uploaded successfully!");
      setTimeout(() => navigate("/templates"), 1500);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to upload template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-root">
      <h1>Upload New Template</h1>
      <p className="upload-sub">Create and share your premium journal template</p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Cover Image URL
          <input
            type="url"
            name="coverUrl"
            value={form.coverUrl}
            onChange={handleChange}
            placeholder="https://example.com/cover.jpg"
          />
        </label>

        <label>
          Content
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={6}
            required
          />
        </label>

        {errorMsg && <div className="upload-error">{errorMsg}</div>}
        {successMsg && <div className="upload-success">{successMsg}</div>}

        <button type="submit" className="upload-btn" disabled={loading}>
          {loading ? "Uploading..." : "Upload Template"}
        </button>
      </form>
    </div>
  );
}
