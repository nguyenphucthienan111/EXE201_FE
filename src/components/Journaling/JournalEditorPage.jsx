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

const moodLabel = {
  happy: "😊 Happy",
  sad: "😢 Sad",
  calm: "😌 Calm",
};

// Chuẩn hoá URL ảnh (server trả path tương đối)
function toAbsolute(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const origin = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
  return u.startsWith("/") ? origin + u : origin + "/" + u;
}

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
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("happy");

  // template background
  const [templateUrl, setTemplateUrl] = useState("");
  const [templateMeta, setTemplateMeta] = useState(null);

  // info
  const info = useMemo(
    () => ({
      chars: content.length,
      words: (content.trim().match(/\S+/g) || []).length,
    }),
    [content]
  );

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
          const list = await getTemplates();
          const arr = Array.isArray(list) ? list : [];
          const found =
            arr.find((t) => t.id === tplId || t._id === tplId) || null;
          if (found) {
            const img =
              found.imageUrl ||
              found.thumbnail ||
              found.preview ||
              found.image ||
              found.templateUrl ||
              "";
            setTemplateUrl(toAbsolute(img));
            setTemplateMeta({
              id: found.id || found._id,
              name: found.name,
              desc: found.description,
              category: (found.category || "default").toLowerCase(),
            });
            if (!j?.content && found.starterText) {
              setContent(found.starterText);
            }
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

  // Mở modal xác nhận
  function onSaveClick() {
    // Validate nhanh
    const t = (title || "").trim();
    const c = (content || "").trim();
    if (!t || !c) {
      setErr("Title và Content không được để trống.");
      return;
    }
    setShowConfirm(true);
  }

  // Người dùng bấm Yes trong modal
  async function confirmSave() {
    if (!id) return;
    setSaving(true);
    setErr("");
    try {
      const payload = {
        title: (title || "").trim(),
        content: (content || "").trim(),
        mood,
        ...(templateMeta?.id ? { templateId: templateMeta.id } : {}),
      };
      await updateJournal(id, payload);
      setShowConfirm(false);
      // Quay về dashboard sau khi save thành công
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

  async function doAnalyze() {
    if (!id) return;
    setAiBusy(true);
    try {
      const res = await analyze({ content, journalId: id });
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
        setContent((prev) =>
          prev
            ? prev + "\n\n" + tips.map((t) => "• " + t).join("\n")
            : tips.map((t) => "• " + t).join("\n")
        );
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function doAssistant() {
    if (!id) return;
    const q = prompt("Ask the assistant (e.g. 'How do I cope with stress today?')");
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
    <div className="ed-wrap">
      <div className="ed-header">
        <h1>Edit Journal</h1>
        <div className="ed-actions">
          <button className="ed-btn ghost" onClick={() => navigate("/journal")}>Back</button>
          <button className="ed-btn" onClick={onSaveClick} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Template info nhỏ gọn */}
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

        {/* Textarea có background template + overlay làm mờ ảnh để dễ đọc */}
        <textarea
          className="ed-textarea"
          placeholder="Start journaling..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            backgroundImage: templateUrl
              ? `linear-gradient(rgba(255,255,255,.84), rgba(255,255,255,.84)), url(${templateUrl})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

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

      {/* Confirm Save Modal */}
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
