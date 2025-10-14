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
import { getTemplates, useTemplate as applyTemplate } from "../../services/templateService";

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
      const hint = [userPlan.tier, userPlan.plan, userPlan.name].filter(Boolean).join(" ");
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
        setTemplatesError("No templates available. (Check /api/templates response & baseURL /api)");
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
        setEntries((prev) => prev.map((x) => (x._id === editing._id ? updated : x)));
        setShowModal(false);
      } else {
        if (useTemplate && !selectedTemplateId) {
          alert("Please select a template or uncheck 'Use a template'.");
          setSaving(false);
          return;
        }

        // 1) Tạo journal KHÔNG gửi templateId (để tách bước apply)
        const created = await createJournal({ title: formTitle, mood: formMood });
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
      const m = err?.response?.data?.message || err?.message || "Failed to save.";
      if (s === 403) alert(m || "Free plan daily limit reached.");
      else alert(m);
    } finally {
      setSaving(false);
    }
  };

  // delete entry
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this journal?")) return;
    try {
      await deleteJournal(id);
      setEntries((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete entry.");
    }
  };

  // Analyze entry
  async function runAnalyze(entry) {
    try {
      const res = await analyze({ content: entry.content, journalId: entry._id });
      const sentiment = res?.data?.sentiment || "?";
      const keywords = (res?.data?.keywords || []).slice(0, 6).join(", ");
      alert(`Sentiment: ${sentiment}\nKeywords: ${keywords || "(none)"}`);
    } catch (e) {
      alert(e?.response?.data?.message || "Analyze failed");
    }
  }

  // Mark synced
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

        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  {df === "today" ? "Today" : df === "week" ? "This Week" : "This Month"}
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
                  className={`jr-chip ${moods.includes(m.id) ? "is-active" : ""}`}
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
            No entries yet. Click <strong>“+ Create New Journal”</strong> to add your first one!
          </div>
        )}

        <div className="jr-grid">
          {pageItems.map((e) => (
            <article key={e._id} className="jr-card">
              <div className="jr-thumb" />
              <div className="jr-card-body">
                <h4 className="jr-card-title">{e.title}</h4>
                <p className="jr-card-excerpt">
                  {e.content?.length > 100 ? e.content.slice(0, 100) + "..." : e.content}
                </p>
                <div className="jr-card-meta">
                  <span className={`jr-mood ${e.mood}`}>{e.mood}</span>
                  <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>
                    {new Date(e.updatedAt || e.createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div className="jr-card-footer">
                  <div className="jr-avatar" />
                  <span className="jr-author">{e.author || "Me"}</span>
                </div>
              </div>

              <div className="jr-card-actions" style={{ display: "flex", gap: 8 }}>
                {/* NEW: vào editor */}
                <button onClick={() => navigate(`/journals/${e._id}/edit`)}>Continue</button>
                {/* Quick edit trong modal */}
                <button onClick={() => openModal(e)}>Edit</button>
                <button onClick={() => handleDelete(e._id)}>Delete</button>
                <button onClick={() => doMarkSynced(e._id)}>Mark Synced</button>
                <button onClick={() => runAnalyze(e)}>Analyze (AI)</button>
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

      <footer className="jr-footer">© {new Date().getFullYear()} My Journal</footer>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? "Quick Edit" : "Create New Journal"}</h2>

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
                            className={`tpl-item ${isSel ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}
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
                                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
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
                <button type="button" className="modal-btn ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="modal-btn" disabled={saving}>
                  {editing ? (saving ? "Saving..." : "Save") : saving ? "Continuing..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
