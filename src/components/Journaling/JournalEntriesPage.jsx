// src/components/Journal/JournalEntriesPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Journal.css";
import {
  getJournals,
  createJournal,
  updateJournal,
  deleteJournal,
  analyze,
  markSynced,
} from "../../services/journalService";
import api from "../../services/api";
import {
  getTemplates,
  useTemplate as applyTemplate,
} from "../../services/templateService";

const moodOptions = [
  { id: "happy", label: "😊 Happy" },
  { id: "sad", label: "😢 Sad" },
  { id: "calm", label: "😌 Calm" },
];

export default function JournalEntriesPage() {
  const navigate = useNavigate();

  // list
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination (client-side)
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  // filter
  const [topSearch, setTopSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [moods, setMoods] = useState([]);

  // modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMood, setFormMood] = useState("happy");
  const [saving, setSaving] = useState(false);

  // template picking (chỉ dùng cho CREATE)
  const [useTemplate, setUseTemplate] = useState(false);
  const [templates, setTemplates] = useState([]); // [{id, name, imageUrl, isPremium?, ...}]
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // premium status (suy từ getTemplates -> userPlan nếu BE có trả)
  const [isPremiumActive, setIsPremiumActive] = useState(null); // null = chưa biết, true/false = xác định

  // Load list từ server
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getJournals({ page: 1, limit: 200 });
        setEntries(Array.isArray(data) ? data : []);
      } catch (e) {
        const s = e?.response?.status;
        if (s === 401) {
          navigate("/login");
          return;
        }
        console.error("Failed to load journals:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const toggleMood = (id) =>
    setMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  // filter client-side
  const filtered = useMemo(() => {
    const now = new Date();
    let start = new Date(0);

    if (dateFilter === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "week") {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else if (dateFilter === "month") {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
    }
    const kw = (keyword || topSearch).toLowerCase().trim();

    return (entries || []).filter((e) => {
      const created = new Date(e.createdAt || e.date || Date.now());
      const byDate = created >= start;
      const byMood = moods.length ? moods.includes(e.mood) : true;
      const byKw = kw
        ? (e.title + " " + (e.content || "")).toLowerCase().includes(kw)
        : true;
      return byDate && byMood && byKw;
    });
  }, [entries, keyword, topSearch, dateFilter, moods]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [keyword, topSearch, dateFilter, moods, limit]);

  // Tính toán phân trang
  const { pageItems, totalPages } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return { pageItems: filtered.slice(start, end), totalPages };
  }, [filtered, page, limit]);

  // mở modal
  const openModal = (entry = null) => {
    if (entry) {
      // Quick edit
      setEditing(entry);
      setFormTitle(entry.title);
      setFormMood(entry.mood);
      setUseTemplate(false);
      setSelectedTemplateId(null);
      setIsPremiumActive(null);
      setTemplates([]);
      setTemplatesError("");
    } else {
      // Create
      setEditing(null);
      setFormTitle("");
      setFormMood("happy");
      setUseTemplate(false);
      setSelectedTemplateId(null);
      setIsPremiumActive(null);
      setTemplates([]);
      setTemplatesError("");
    }
    setShowModal(true);
  };

  // helper: xác định premium flag từ template (khi BE có trả)
  const isTplPremium = (t) =>
    t?.isPremium === true || t?.tier === "premium" || t?.plan === "premium";

  // helper: suy ra trạng thái premium từ userPlan (chuỗi | boolean | object)
  const inferPremiumFromUserPlan = (userPlan) => {
    if (typeof userPlan === "string") return /premium/i.test(userPlan);
    if (typeof userPlan === "boolean") return userPlan;
    if (userPlan && typeof userPlan === "object") {
      if (userPlan.isPremiumActive === true) return true;
      const hint = [userPlan.tier, userPlan.plan, userPlan.name]
        .filter(Boolean)
        .join(" ");
      if (hint) return /premium/i.test(hint);
    }
    return null;
  };

  // Hàm load templates (gom lại để dùng cả khi click Reload)
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError("");
    try {
      const res = await getTemplates();
      // res: { list, userPlan } theo service mới
      const list = Array.isArray(res?.list) ? res.list : [];
      setTemplates(list);
      setIsPremiumActive(inferPremiumFromUserPlan(res?.userPlan));

      if (list.length === 0) {
        setTemplatesError(
          "No templates available. (Check /api/templates response & baseURL /api)"
        );
      }
    } catch (e) {
      console.error("Failed to load templates", e);
      setTemplates([]);
      setIsPremiumActive(null);
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load templates.";
      setTemplatesError(msg);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Tải templates khi bật "Use template"
  useEffect(() => {
    if (!showModal || !useTemplate || editing) return;
    loadTemplates();
  }, [showModal, useTemplate, editing, loadTemplates]);

  // submit create/update (CREATE → APPLY TEMPLATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateJournal(editing._id, {
          title: formTitle,
          mood: formMood,
        });
        setEntries((prev) =>
          prev.map((x) => (x._id === editing._id ? updated : x))
        );
        setShowModal(false);
      } else {
        if (useTemplate && !selectedTemplateId) {
          alert("Please select a template or uncheck 'Use a template'.");
          setSaving(false);
          return;
        }

        // 1) Tạo journal KHÔNG gửi templateId (để tách bước apply)
        const created = await createJournal({
          title: formTitle,
          mood: formMood,
        });
        const newId =
          created?._id ||
          created?.id ||
          created?.data?._id ||
          created?.data?.id ||
          created?.journal?._id ||
          created?.data?.journal?._id ||
          created?.journalId ||
          created?.data?.journalId;

        if (!newId) {
          console.error("Unexpected createJournal response:", created);
          alert("Create journal failed: missing id from server.");
          setSaving(false);
          return;
        }

        // 2) Nếu dùng template thì APPLY; 403 => chưa có quyền (không phải Premium)
        if (useTemplate && selectedTemplateId) {
          try {
            await applyTemplate(selectedTemplateId, newId);
          } catch (err) {
            const s = err?.response?.status;
            const m = err?.response?.data?.message || "Apply template failed.";
            if (s === 403) {
              alert(m || "Premium access required.");
            } else if (s === 404) {
              alert("Template or Journal not found.");
            } else {
              alert(m);
            }
            // vẫn cho vào editor; chỉ là template chưa apply
          }
        }

        setShowModal(false);
        navigate(`/journals/${newId}/edit`);
      }
    } catch (err) {
      const s = err?.response?.status;
      const m =
        err?.response?.data?.message || err?.message || "Failed to save.";
      if (s === 403) alert(m || "Free plan daily limit reached.");
      else alert(m);
    } finally {
      setSaving(false);
    }
  };

  // delete entry
  const handleDelete = async (id) => {
    setDeleteEntryId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteEntryId) return;
    try {
      await deleteJournal(deleteEntryId);
      setEntries((prev) => prev.filter((x) => x._id !== deleteEntryId));
      setShowDeleteModal(false);
      setDeleteEntryId(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete entry.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteEntryId(null);
  };

  // View AI analysis history
  const [showAIHistory, setShowAIHistory] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [aiHistory, setAiHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState(null);

  async function viewAIHistory(entry) {
    setSelectedEntry(entry);
    setShowAIHistory(true);
    setLoadingHistory(true);

    try {
      // Use journalService to get AI analysis history
      const { data } = await api.get(`/journals/${entry._id}/analysis-history`);
      setAiHistory(data.analyses || []);
    } catch (e) {
      console.error("Failed to load AI history:", e);
      setAiHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Mark synced - đánh dấu journal đã được đồng bộ với thiết bị khác
  async function doMarkSynced(id) {
    try {
      await markSynced(id);
      alert("Marked as synced.");
    } catch (e) {
      alert(e?.response?.data?.message || "Sync failed");
    }
  }

  return (
    <div className="jr-root">
      {/* HERO */}
      <section className="jr-hero">
        <h1>My Journal Entries</h1>
        <p>Look back and see how far you have come.</p>

        <div className="jr-search-wide">
          <input
            value={topSearch}
            onChange={(e) => setTopSearch(e.target.value)}
            placeholder="Search by keyword..."
            aria-label="Search by keyword"
          />
        </div>

        <div
          style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button className="jr-btn" onClick={() => openModal()}>
            + Create New Journal
          </button>
          {/* NEW: Continue Writing entry gần nhất */}
        </div>
      </section>

      {/* FILTERS */}
      <section className="jr-filters-wrap">
        <aside className="jr-left-title">
          <h2>Filter Your Entries</h2>
        </aside>

        <div className="jr-filters">
          <div className="jr-block">
            <label className="jr-block-title">Search by keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by keyword..."
            />
          </div>

          <div className="jr-block">
            <label className="jr-block-title">Filter by Date</label>
            <div className="jr-chips">
              {["today", "week", "month"].map((df) => (
                <button
                  key={df}
                  className={`jr-chip ${dateFilter === df ? "is-active" : ""}`}
                  onClick={() => setDateFilter(df)}
                >
                  {df === "today"
                    ? "Today"
                    : df === "week"
                    ? "This Week"
                    : "This Month"}
                </button>
              ))}
            </div>
          </div>

          <div className="jr-block">
            <label className="jr-block-title">Mood Filter</label>
            <div className="jr-chips">
              {moodOptions.map((m) => (
                <button
                  key={m.id}
                  className={`jr-chip ${
                    moods.includes(m.id) ? "is-active" : ""
                  }`}
                  onClick={() => toggleMood(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ENTRIES GRID */}
      <section className="jr-entries">
        <h3>Your Journal Entries</h3>
        {loading && <p>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="jr-empty">
            No entries yet. Click <strong>“+ Create New Journal”</strong> to add
            your first one!
          </div>
        )}

        <div className="jr-grid">
          {pageItems.map((e) => (
            <article key={e._id} className="jr-card">
              <div className="jr-thumb" />
              <div className="jr-card-body">
                <h4 className="jr-card-title">{e.title}</h4>
                <p className="jr-card-excerpt">
                  {e.content?.length > 100
                    ? e.content.slice(0, 100) + "..."
                    : e.content}
                </p>
                <div className="jr-card-meta">
                  <span className={`jr-mood ${e.mood}`}>{e.mood}</span>
                  <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>
                    {new Date(
                      e.updatedAt || e.createdAt || Date.now()
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="jr-card-footer">
                  <div className="jr-avatar" />
                  <span className="jr-author">{e.author || "Me"}</span>
                </div>
              </div>

              <div
                className="jr-card-actions"
                style={{ display: "flex", gap: 8 }}
              >
                {/* NEW: vào editor */}
                <button onClick={() => navigate(`/journals/${e._id}/edit`)}>
                  Continue
                </button>
                {/* Quick edit trong modal */}
                <button onClick={() => openModal(e)}>Edit</button>
                <button onClick={() => handleDelete(e._id)}>Delete</button>
                <button onClick={() => doMarkSynced(e._id)}>Mark Synced</button>
                <button onClick={() => viewAIHistory(e)}>
                  View AI History
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="jr-pager" style={{ marginTop: 18 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={page === 1 ? "is-disabled" : ""}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={p === page ? "is-active" : ""}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={page === totalPages ? "is-disabled" : ""}
            >
              Next
            </button>
          </div>
        )}
      </section>

      <footer className="jr-footer">
        © {new Date().getFullYear()} My Journal
      </footer>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowModal(false);
            setEditing(null);
            setFormTitle("");
            setFormMood("happy");
            setUseTemplate(false);
            setSelectedTemplateId(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">
              {editing ? "Quick Edit" : "Create New Journal"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                className="modal-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Title"
                required
              />

              <select
                className="modal-input"
                value={formMood}
                onChange={(e) => setFormMood(e.target.value)}
              >
                {moodOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Toggle chọn template (chỉ khi CREATE) */}
              {!editing && (
                <label className="modal-check">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                  />
                  <span style={{ marginLeft: 8 }}>Use a template</span>
                </label>
              )}

              {/* Gallery template */}
              {!editing && useTemplate && (
                <div className="tpl-wrap">
                  {templatesLoading ? (
                    <div>Loading templates…</div>
                  ) : templates.length === 0 ? (
                    <div style={{ fontSize: 14, opacity: 0.7 }}>
                      {templatesError || "No templates available."}{" "}
                      <button
                        type="button"
                        className="jr-btn ghost"
                        style={{ marginLeft: 8 }}
                        onClick={loadTemplates}
                      >
                        Reload
                      </button>
                    </div>
                  ) : (
                    <div className="tpl-grid">
                      {templates.map((t) => {
                        const tid = t.id ?? t._id ?? t.templateId; // robust
                        const isSel = selectedTemplateId === tid;
                        const premium = isTplPremium(t);
                        const disabled = premium && isPremiumActive === false; // nếu user không premium thì disable

                        return (
                          <button
                            key={tid}
                            type="button"
                            className={`tpl-item ${isSel ? "is-active" : ""} ${
                              disabled ? "is-disabled" : ""
                            }`}
                            onClick={() => {
                              if (disabled) {
                                alert("Premium only");
                                return;
                              }
                              setSelectedTemplateId(tid);
                            }}
                            title={premium ? `${t.name} (Premium)` : t.name}
                            aria-disabled={disabled}
                          >
                            {t.imageUrl ? (
                              <img
                                src={t.imageUrl}
                                alt={t.name}
                                loading="lazy"
                                onError={(e) =>
                                  (e.currentTarget.style.visibility = "hidden")
                                }
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: 110,
                                  borderRadius: 10,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            )}
                            <span className="tpl-name">
                              {t.name || "Untitled"} {premium ? "★" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn ghost"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormTitle("");
                    setFormMood("happy");
                    setUseTemplate(false);
                    setSelectedTemplateId(null);
                  }}
                >
                  Cancel
                </button>
                <button className="modal-btn" disabled={saving}>
                  {editing
                    ? saving
                      ? "Saving..."
                      : "Save"
                    : saving
                    ? "Continuing..."
                    : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI History Modal */}
      {showAIHistory && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAIHistory(false)}
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
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "hidden",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  AI
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  AI Analysis History
                </h2>
              </div>
              <button
                onClick={() => setShowAIHistory(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "4px",
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            {loadingHistory ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                Loading analysis history...
              </div>
            ) : aiHistory.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                No AI analysis history yet
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "50vh",
                  overflowY: "auto",
                  marginBottom: "20px",
                }}
              >
                {aiHistory.map((analysis, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "16px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    {/* Analysis Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        Analysis #{index + 1}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {new Date(analysis.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Primary Emotion & Sentiment Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        marginBottom: "20px",
                      }}
                    >
                      {/* Primary Emotion Card */}
                      <div
                        style={{
                          backgroundColor: "#f3f4f6",
                          borderRadius: "8px",
                          padding: "16px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "8px",
                          }}
                        >
                          Primary Emotion
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "4px",
                          }}
                        >
                          {analysis.results?.emotionAnalysis?.primaryEmotion ||
                            "N/A"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          Score:{" "}
                          {analysis.results?.emotionAnalysis?.emotionScore ||
                            "N/A"}
                          Conf:{" "}
                          {analysis.results?.emotionAnalysis?.confidence ||
                            "N/A"}
                        </div>
                      </div>

                      {/* Sentiment Card */}
                      <div
                        style={{
                          backgroundColor: "#fce7f3",
                          borderRadius: "8px",
                          padding: "16px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "8px",
                          }}
                        >
                          Sentiment
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "4px",
                          }}
                        >
                          {analysis.results?.sentimentAnalysis
                            ?.overallSentiment || "N/A"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          Score:{" "}
                          {analysis.results?.sentimentAnalysis
                            ?.sentimentScore || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Mental Health Indicators */}
                    {analysis.results?.mentalHealthIndicators && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Mental Health Indicators
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#3730a3",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Stress:{" "}
                            {
                              analysis.results.mentalHealthIndicators
                                .stressLevel
                            }
                          </span>
                          <span
                            style={{
                              backgroundColor: analysis.results
                                .mentalHealthIndicators.depressionSigns
                                ? "#fef2f2"
                                : "#f0fdf4",
                              color: analysis.results.mentalHealthIndicators
                                .depressionSigns
                                ? "#dc2626"
                                : "#16a34a",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Depression:{" "}
                            {analysis.results.mentalHealthIndicators
                              .depressionSigns
                              ? "Yes"
                              : "No"}
                          </span>
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#3730a3",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Anxiety:{" "}
                            {
                              analysis.results.mentalHealthIndicators
                                .anxietyLevel
                            }
                          </span>
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#3730a3",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Risk:{" "}
                            {analysis.results.mentalHealthIndicators.riskLevel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {analysis.results?.keywords && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Keywords
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {analysis.results.keywords.emotional &&
                            analysis.results.keywords.emotional.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Emotional
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {analysis.results.keywords.emotional.map(
                                    (keyword, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          backgroundColor: "#e0e7ff",
                                          color: "#3730a3",
                                          padding: "4px 12px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {keyword}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {analysis.results.keywords.behavioral &&
                            analysis.results.keywords.behavioral.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Behavioral
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {analysis.results.keywords.behavioral.map(
                                    (keyword, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          backgroundColor: "#e0e7ff",
                                          color: "#3730a3",
                                          padding: "4px 12px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {keyword}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {analysis.results?.improvementSuggestions && (
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Improvement Suggestions
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {/* Immediate Actions */}
                          {analysis.results.improvementSuggestions
                            .immediateActions &&
                            analysis.results.improvementSuggestions
                              .immediateActions.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#dc2626",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Immediate
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                  {analysis.results.improvementSuggestions.immediateActions.map(
                                    (action, i) => (
                                      <li
                                        key={i}
                                        style={{
                                          fontSize: "13px",
                                          color: "#374151",
                                          marginBottom: "4px",
                                          lineHeight: "1.4",
                                        }}
                                      >
                                        {action}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Short-term Goals */}
                          {analysis.results.improvementSuggestions
                            .shortTermGoals &&
                            analysis.results.improvementSuggestions
                              .shortTermGoals.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#f59e0b",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Short-term
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                  {analysis.results.improvementSuggestions.shortTermGoals.map(
                                    (goal, i) => (
                                      <li
                                        key={i}
                                        style={{
                                          fontSize: "13px",
                                          color: "#374151",
                                          marginBottom: "4px",
                                          lineHeight: "1.4",
                                        }}
                                      >
                                        {goal}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Long-term Strategies */}
                          {analysis.results.improvementSuggestions
                            .longTermStrategies &&
                            analysis.results.improvementSuggestions
                              .longTermStrategies.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#059669",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Long-term
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                  {analysis.results.improvementSuggestions.longTermStrategies.map(
                                    (strategy, i) => (
                                      <li
                                        key={i}
                                        style={{
                                          fontSize: "13px",
                                          color: "#374151",
                                          marginBottom: "4px",
                                          lineHeight: "1.4",
                                        }}
                                      >
                                        {strategy}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                position: "sticky",
                bottom: 0,
                backgroundColor: "white",
                zIndex: 10,
              }}
            >
              <button
                onClick={() => setShowAIHistory(false)}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: "24px",
                marginBottom: "16px",
                color: "#dc2626",
              }}
            >
              ⚠️
            </div>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Delete Journal Entry
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to delete this journal entry? This action
              cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#4b5563")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#6b7280")}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#b91c1c")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#dc2626")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
