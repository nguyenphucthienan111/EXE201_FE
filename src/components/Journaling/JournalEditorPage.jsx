// src/components/Journal/JournalEditorPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../style/Journal.css";
import {
  getJournal,
  updateJournal,
  analyze,
  suggestBasic,
  suggestAdvanced,
  assistant,
} from "../../services/journalService";
import { getTemplates } from "../../services/templateService";

// ✅ Rich text editor
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const moodLabel = {
  happy: "😊 Happy",
  sad: "😢 Sad",
  calm: "😌 Calm",
};

// Chuẩn hoá URL ảnh
function toAbsolute(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const origin = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
  return u.startsWith("/") ? origin + u : origin + "/" + u;
}

// Lấy plain text để đếm words/chars
function htmlToText(html = "") {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

// Toolbar giống Word
const editorModules = {
  toolbar: [
    [{ font: [] }, { size: [] }], // font + cỡ chữ
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

// Formats cho Quill (khớp toolbar)
const editorFormats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "list",
  "bullet",
  "align",
  "blockquote",
  "code-block",
  "link",
  "image",
];

export default function JournalEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [err, setErr] = useState("");

  // Xác nhận save
  const [showConfirm, setShowConfirm] = useState(false);

  // journal state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML từ Quill
  const [mood, setMood] = useState("happy");

  // template background
  const [templateUrl, setTemplateUrl] = useState("");
  const [templateMeta, setTemplateMeta] = useState(null);

  // info (đếm dựa trên text từ HTML)
  const info = useMemo(() => {
    const text = htmlToText(content);
    return {
      chars: text.length,
      words: text ? text.split(/\s+/).length : 0,
    };
  }, [content]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const j = await getJournal(id);
        setTitle(j?.title || "");
        setContent(j?.content || j?.templateContent || "");
        setMood(j?.mood || "happy");

        // Ưu tiên lấy templateId từ journal; fallback lấy từ state khi navigate
        const passedTplId = location.state?.templateId || null;
        const tplId = j?.templateId || passedTplId || null;

        if (tplId) {
          const res = await getTemplates();
          let arr = [];

          if (Array.isArray(res)) arr = res;
          else if (Array.isArray(res?.list)) arr = res.list;
          else if (res?.data) {
            arr = [
              ...(res.data.defaultTemplates || []),
              ...(res.data.premiumTemplates || []),
              ...(res.data.userTemplates || []),
              ...(res.data.templates || []),
            ];
          }

          const found =
            arr.find((t) => (t._id || t.id) === tplId) ||
            arr.find((t) => t._id === tplId || t.id === tplId) ||
            null;

          if (found) {
            const img =
              found.imageUrl ||
              found.thumbnailUrl ||
              found.thumbnail ||
              found.preview ||
              found.image ||
              found.templateUrl ||
              "";

            setTemplateUrl(toAbsolute(img));
            setTemplateMeta({
              id: found._id || found.id,
              name: found.name,
              desc: found.description,
              category: (found.category || "default").toLowerCase(),
            });

            if (!j?.content && found.starterText) {
              setContent(found.starterText);
            }
          } else {
            setTemplateUrl("");
            setTemplateMeta(null);
          }
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Not found";
        setErr(msg);
        setTimeout(() => navigate("/journal"), 1200);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, location.state]);

  // Save confirm
  function onSaveClick() {
    const t = (title || "").trim();
    const c = htmlToText(content);
    if (!t || !c) {
      setErr("Title và Content không được để trống.");
      return;
    }
    setShowConfirm(true);
  }

  async function confirmSave() {
    if (!id) return;
    setSaving(true);
    setErr("");
    try {
      const payload = {
        title: (title || "").trim(),
        content: content || "",
        mood,
        ...(templateMeta?.id ? { templateId: templateMeta.id } : {}),
      };
      await updateJournal(id, payload);
      setShowConfirm(false);
      navigate("/journal");
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Save failed.";
      setErr(`Save error${status ? " (" + status + ")" : ""}: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function cancelConfirm() {
    setShowConfirm(false);
  }

  // AI tools
  async function doAnalyze() {
    if (!id) return;
    setAiBusy(true);
    try {
      const res = await analyze({ content: htmlToText(content), journalId: id });
      const s = res?.data?.sentiment || res?.data?.sentiment?.label || "?";
      const kw = (res?.data?.keywords || []).slice(0, 8).join(", ");
      alert(`Sentiment: ${s}\nKeywords: ${kw || "(none)"}`);
    } catch (e) {
      alert(e?.response?.data?.message || "Analyze failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function doSuggest(premium = false) {
    if (!id) return;
    setAiBusy(true);
    try {
      const fn = premium ? suggestAdvanced : suggestBasic;
      const res = await fn({ mood, topic: "reflection", journalId: id });
      const tips = res?.data?.suggestions || [];
      if (!tips.length) {
        alert("No suggestions.");
      } else {
        const bullets = tips.map((t) => `<p>• ${t}</p>`).join("");
        setContent((prev) => (prev ? prev + "<br/>" + bullets : bullets));
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function doAssistant() {
    if (!id) return;
    const q = prompt("Ask the assistant:");
    if (!q) return;
    setAiBusy(true);
    try {
      const res = await assistant({ question: q, context: { journalId: id, mood } });
      alert(res?.data?.response || "No answer.");
    } catch (e) {
      alert(e?.response?.data?.message || "Assistant failed.");
    } finally {
      setAiBusy(false);
    }
  }

  if (loading) return <div className="ed-wrap"><p>Loading...</p></div>;

  return (
    <div className="ed-wrap wide">
      <div className="ed-header">
        <h1>Edit Journal</h1>
        <div className="ed-actions">
          <button className="ed-btn ghost" onClick={() => navigate("/journal")}>Back</button>
          <button className="ed-btn" onClick={onSaveClick} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {templateMeta && (
        <div className="ed-tpl">
          <div className="ed-tpl-right">
            <div className="ed-tpl-name">{templateMeta.name}</div>
            <div className="ed-tpl-desc">{templateMeta.desc || "—"}</div>
            <span className={`ed-tpl-tag ${templateMeta.category}`}>
              {templateMeta.category}
            </span>
          </div>
        </div>
      )}

      {!!err && <div className="ed-alert">{err}</div>}

      <div className="ed-form">
        <input
          className="ed-input ed-title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="ed-toolbar">
          <select className="ed-select" value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="happy">{moodLabel.happy}</option>
            <option value="sad">{moodLabel.sad}</option>
            <option value="calm">{moodLabel.calm}</option>
          </select>

          <div className="ed-spacer" />

          <span className="ed-meta">{info.words} words</span>
          <span className="ed-dot" />
          <span className="ed-meta">{info.chars} chars</span>
        </div>

        {/* ✅ Editor với background FULL */}
        <div
          className="editor-container"
          style={{
            backgroundImage: templateUrl ? `url(${templateUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            className="editor-overlay"
            style={{
              backgroundColor: templateUrl ? "rgba(255,255,255,0.84)" : "transparent",
              borderRadius: 12,
              padding: 8,
            }}
          >
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={editorModules}
              formats={editorFormats}
              placeholder="Start journaling..."
              style={{
                minHeight: 600,
                borderRadius: 10,
              }}
            />
          </div>
        </div>

        <div className="ed-footerbar">
          <button className="ed-btn" onClick={doAnalyze} disabled={aiBusy}>Analyze (AI)</button>
          <button className="ed-btn ghost" onClick={() => doSuggest(false)} disabled={aiBusy}>
            Suggest (AI)
          </button>
          <button className="ed-btn ghost" onClick={() => doSuggest(true)} disabled={aiBusy}>
            Suggest+ (AI)
          </button>
          <button className="ed-btn ghost" onClick={doAssistant} disabled={aiBusy}>
            Ask Assistant
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-backdrop" onClick={cancelConfirm}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Save changes?</h2>
            <p style={{ margin: "8px 0 16px", color: "#6b7280" }}>
              Your journal will be saved and you will return to the dashboard.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn ghost" onClick={cancelConfirm}>
                Cancel
              </button>
              <button type="button" className="modal-btn" onClick={confirmSave} disabled={saving}>
                {saving ? "Saving..." : "Yes, Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
