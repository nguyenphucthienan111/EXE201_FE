// src/components/Journal/JournalEditorPage.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../style/Journal.css";
import {
  getJournal,
  updateJournal,
  saveAnalysisHistory, // ⬅️ thêm để lưu lịch sử
} from "../../services/journalService";
import api from "../../services/api";
import { getTemplates, toAbsUrl } from "../../services/templateService";
import useJournalAI from "../../hooks/useJournalAI";
import SaveConfirmModal from "../common/SaveConfirmModal";
import AnalyzeResultModal from "../Journaling/AnalyzeResultModal";

// Rich text editor
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { editorModules, editorFormats } from "../../config/quillConfig";
import { htmlToText } from "../../utils/text";

const moodLabel = {
  happy: "😊 Happy",
  sad: "😢 Sad",
  calm: "😌 Calm",
};

export default function JournalEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // confirm modal
  const [showConfirm, setShowConfirm] = useState(false);

  // analysis modal
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  // confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // journal state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("happy");

  // template
  const [templateUrl, setTemplateUrl] = useState("");
  const [templateMeta, setTemplateMeta] = useState(null);

  // export
  const exportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // AI hook
  const { busy: aiBusy, analyze, suggestBasic, suggestPlus } = useJournalAI();

  // 🔒 Khi AI đang chạy -> khóa toàn bộ thao tác
  const locked = aiBusy;

  const info = useMemo(() => {
    const text = htmlToText(content);
    return { chars: text.length, words: text ? text.split(/\s+/).length : 0 };
  }, [content]);

  // 🔒 Chặn phím tắt/nhập liệu khi đang locked
  useEffect(() => {
    if (!locked) return;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keypress", onKey, { capture: true });
    window.addEventListener("keyup", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
      window.removeEventListener("keypress", onKey, { capture: true });
      window.removeEventListener("keyup", onKey, { capture: true });
    };
  }, [locked]);

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

        // Check analysis history count
        try {
          const { data } = await api.get(`/journals/${id}/analysis-history`);
          setAnalysisCount(data.analyses?.length || 0);
        } catch (e) {
          console.warn("Failed to load analysis history:", e);
          setAnalysisCount(0);
        }

        const passedTplId = location.state?.templateId || null;
        const tplId = j?.templateId || passedTplId || null;

        if (tplId) {
          const res = await getTemplates();
          const arr = Array.isArray(res?.list) ? res.list : [];
          const found =
            arr.find((t) => t.id === tplId || t.id === String(tplId)) ||
            arr.find((t) => (t.raw?._id || t.raw?.id) === tplId) ||
            null;

          if (found) {
            setTemplateUrl(toAbsUrl(found.imageUrl || ""));
            setTemplateMeta({
              id: found.id,
              name: found.name,
              desc: found.description,
              category: (found.category || "default").toLowerCase(),
            });
            if (!j?.content && found.starterText) setContent(found.starterText);
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

  // AI Analysis functions with useCallback
  const runAnalysis = useCallback(async () => {
    try {
      const res = await analyze({
        content: htmlToText(content),
        journalId: id,
      });
      if (!res) return alert("No analysis result.");

      // Lưu lịch sử để tab History có dữ liệu
      try {
        await saveAnalysisHistory(id, res);
        setAnalysisCount((prev) => prev + 1); // Update count
      } catch (e2) {
        // Không chặn UI nếu lưu thất bại
        console.warn(
          "Save history failed:",
          e2?.response?.data?.message || e2?.message
        );
      }

      setAnalysisResult(res); // res: { emotionAnalysis, ... }
      setShowAnalysis(true);
    } catch (e) {
      alert(e?.response?.data?.message || "Analyze failed.");
    }
  }, [analyze, content, id, saveAnalysisHistory]);

  const runSuggest = useCallback(async () => {
    try {
      const res = await suggestBasic({
        mood,
        topic: "reflection",
        journalId: id,
      });
      const tips = res?.suggestions || [];
      if (!tips.length) return alert("No suggestions.");
      const bullets = tips.map((t) => `<p>• ${t}</p>`).join("");
      setContent((prev) => (prev ? prev + "<br/>" + bullets : bullets));
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest failed.");
    }
  }, [suggestBasic, mood, id]);

  const runSuggestPlus = useCallback(async () => {
    try {
      const res = await suggestPlus({
        mood,
        topic: "reflection",
        journalId: id,
      });
      const tips = res?.suggestions || [];
      if (!tips.length) return alert("No suggestions.");
      const bullets = tips.map((t) => `<p>• ${t}</p>`).join("");
      setContent((prev) => (prev ? prev + "<br/>" + bullets : bullets));
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest+ failed.");
    }
  }, [suggestPlus, mood, id]);

  // Show confirmation modal
  const showConfirmation = (actionType) => {
    setConfirmAction(actionType);
    setShowConfirmModal(true);
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    setShowConfirmModal(false);
    if (!confirmAction) return;

    try {
      if (confirmAction === "analyze") {
        await runAnalysis();
      } else if (confirmAction === "suggest") {
        await runSuggest();
      } else if (confirmAction === "suggestPlus") {
        await runSuggestPlus();
      }
    } catch (e) {
      console.error("Action failed:", e);
    }
    setConfirmAction(null);
  };

  // ✅ Analyze (AI) – show modal component + lưu history
  const onAnalyze = async () => {
    if (!id) return;

    // Check if this journal has been analyzed before
    if (analysisCount > 0) {
      showConfirmation("analyze");
      return;
    }

    try {
      const res = await analyze({
        content: htmlToText(content),
        journalId: id,
      });
      if (!res) return alert("No analysis result.");

      // Lưu lịch sử để tab History có dữ liệu
      try {
        await saveAnalysisHistory(id, res);
        setAnalysisCount((prev) => prev + 1); // Update count
      } catch (e2) {
        // Không chặn UI nếu lưu thất bại
        console.warn(
          "Save history failed:",
          e2?.response?.data?.message || e2?.message
        );
      }

      setAnalysisResult(res); // res: { emotionAnalysis, ... }
      setShowAnalysis(true);
    } catch (e) {
      alert(e?.response?.data?.message || "Analyze failed.");
    }
  };

  const onSuggest = async () => {
    if (!id) return;

    // Check if this journal has been analyzed before
    if (analysisCount > 0) {
      showConfirmation("suggest");
      return;
    }

    try {
      const res = await suggestBasic({
        mood,
        topic: "reflection",
        journalId: id,
      });
      const tips = res?.suggestions || [];
      if (!tips.length) return alert("No suggestions.");
      const bullets = tips.map((t) => `<p>• ${t}</p>`).join("");
      setContent((prev) => (prev ? prev + "<br/>" + bullets : bullets));
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest failed.");
    }
  };

  const onSuggestPlus = async () => {
    if (!id) return;

    // Check if this journal has been analyzed before
    if (analysisCount > 0) {
      showConfirmation("suggestPlus");
      return;
    }

    try {
      const res = await suggestPlus({
        mood,
        topic: "reflection",
        journalId: id,
      });
      const tips = res?.suggestions || [];
      if (!tips.length) return alert("No suggestions.");
      const bullets = tips.map((t) => `<p>• ${t}</p>`).join("");
      setContent((prev) => (prev ? prev + "<br/>" + bullets : bullets));
    } catch (e) {
      alert(e?.response?.data?.message || "Suggest+ failed.");
    }
  };

  // Export PDF
  async function handleExportPDF() {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      setExporting(true);
      await new Promise((r) => setTimeout(r, 80));
      const node = exportRef.current;
      if (!node) return;

      const filename = `${(title || "journal").replace(
        /\s+/g,
        "-"
      )}.pdf`.toLowerCase();
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: null },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(node)
        .save();
    } catch (e) {
      console.error(e);
      alert("Export PDF fail.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="ed-wrap">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`ed-wrap wide ${locked ? "is-locked" : ""}`}>
      {/* 🔒 Screen overlay khi AI chạy */}
      {locked && (
        <div
          className="screen-lock"
          aria-busy="true"
          aria-label="AI is working"
        >
          <div className="screen-lock__spinner" />
          <div className="screen-lock__text">AI is working… please wait</div>
        </div>
      )}

      <div className="ed-header">
        <h1>Edit Journal</h1>
        <div className="ed-actions">
          <button
            className="ed-btn ghost"
            onClick={() => navigate("/journal")}
            disabled={locked || saving}
          >
            Back
          </button>
          <button
            className="ed-btn ghost"
            onClick={handleExportPDF}
            disabled={locked || exporting}
          >
            Export PDF
          </button>
          <button
            className="ed-btn"
            onClick={onSaveClick}
            disabled={locked || saving}
          >
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
          disabled={locked}
        />

        <div className="ed-toolbar">
          <select
            className="ed-select"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            disabled={locked}
          >
            <option value="happy">{moodLabel.happy}</option>
            <option value="sad">{moodLabel.sad}</option>
            <option value="calm">{moodLabel.calm}</option>
          </select>

          <div className="ed-spacer" />

          <span className="ed-meta">{info.words} words</span>
          <span className="ed-dot" />
          <span className="ed-meta">{info.chars} chars</span>
        </div>

        <div
          ref={exportRef}
          className={`editor-container no-overlay${
            exporting ? " exporting" : ""
          }`}
          style={{
            backgroundImage: templateUrl ? `url(${templateUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h1 className="export-title">{title || "Untitled Journal"}</h1>

          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={editorModules}
            formats={editorFormats}
            placeholder="Start journaling..."
            style={{ minHeight: 600, borderRadius: 10 }}
            readOnly={locked} // 🔒 khóa editor khi AI đang chạy
          />
        </div>

        <div className="ed-footerbar">
          <button
            className="ed-btn"
            onClick={onAnalyze}
            disabled={locked || aiBusy}
          >
            Analyze (AI)
          </button>
          <button
            className="ed-btn ghost"
            onClick={onSuggest}
            disabled={locked || aiBusy}
          >
            Suggest (AI)
          </button>
          <button
            className="ed-btn ghost"
            onClick={onSuggestPlus}
            disabled={locked || aiBusy}
          >
            Suggest+ (AI)
          </button>
        </div>
      </div>

      {/* Confirm Save */}
      <SaveConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        saving={saving}
      />

      {/* Modal AI (truyền journalId để tab History hoạt động) */}
      <AnalyzeResultModal
        open={showAnalysis}
        data={analysisResult}
        onClose={() => setShowAnalysis(false)}
        journalId={id}
      />

      {/* AI Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "24px" }}>⚠️</span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                AI Analysis Confirmation
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                This journal has been analyzed{" "}
                <strong>{analysisCount} time(s)</strong> before. Do you want to
                run another AI analysis?
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                style={{
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
