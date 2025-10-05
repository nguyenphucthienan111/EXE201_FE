import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Journal.css";
import {
  getJournals,
  createJournal,
  updateJournal,
  deleteJournal,
  suggestBasic,
  suggestAdvanced,
  analyze,
  markSynced,
  getUsage,
} from "../../services/journalService";

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
  const [limit] = useState(9); // 3x3 card/ trang sẽ đẹp hơn

  // filter
  const [topSearch, setTopSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [moods, setMoods] = useState([]);

  // modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formMood, setFormMood] = useState("happy");
  const [saving, setSaving] = useState(false);

  // AI Suggestion (trong modal)
  const [usage, setUsage] = useState(null);
  const [aiTopic, setAiTopic] = useState("gratitude");
  const [aiMood, setAiMood] = useState("happy");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTips, setAiTips] = useState([]);

  // Load usage (quota) một lần
  useEffect(() => {
    (async () => {
      try {
        const u = await getUsage();
        setUsage(u);
      } catch {
        // intentionally ignored
      }
    })();
  }, []);

  // Load list từ server (lấy nhiều rồi phân trang client)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // có thể tăng limit fetch server nếu muốn
        const data = await getJournals({ page: 1, limit: 200 });
        setEntries(data || []);
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

  const toggleMood = (id) => {
    setMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

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
      const byKw = kw ? (e.title + " " + e.content).toLowerCase().includes(kw) : true;
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
    const currentPage = Math.min(page, totalPages); // nếu đang ở page lớn hơn total sau filter -> kéo về cuối
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return {
      pageItems: filtered.slice(start, end),
      totalPages,
    };
  }, [filtered, page, limit]);

  // mở modal
  const openModal = (entry = null) => {
    if (entry) {
      setEditing(entry);
      setFormTitle(entry.title);
      setFormContent(entry.content);
      setFormMood(entry.mood);
    } else {
      setEditing(null);
      setFormTitle("");
      setFormContent("");
      setFormMood("happy");
    }
    // reset AI box mỗi lần mở
    setAiTopic("gratitude");
    setAiMood("happy");
    setAiTips([]);
    setShowModal(true);
  };

  // submit create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateJournal(editing._id, {
          title: formTitle,
          content: formContent,
          mood: formMood,
        });
        setEntries((prev) => prev.map((x) => (x._id === editing._id ? updated : x)));
      } else {
        const created = await createJournal({
          title: formTitle,
          content: formContent,
          mood: formMood,
        });
        setEntries((prev) => [created, ...prev]);
      }
      setShowModal(false);
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

  // AI suggest trong modal
  async function runSuggestInModal(premium = false) {
    setAiLoading(true);
    setAiTips([]);
    try {
      const fn = premium ? suggestAdvanced : suggestBasic;
      const res = await fn({
        topic: aiTopic,
        mood: aiMood,
        journalId: editing?._id,
      });
      setAiTips(res?.data?.suggestions || []);
      try {
        const u = await getUsage();
        setUsage(u);
      } catch {
        // intentionally ignored
      }
    } catch (e) {
      const s = e?.response?.status;
      const m = e?.response?.data?.message || e?.message || "Failed.";
      if (s === 403) alert(m || "Free plan daily limit reached.");
      else alert(m);
    } finally {
      setAiLoading(false);
    }
  }

  const insertTip = (text) => {
    if (!text) return;
    setFormContent((prev) => (prev ? prev + "\n\n" + text : text));
  };

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

        <div style={{ marginTop: "20px" }}>
          <button className="jr-btn" onClick={() => openModal()}>
            + Create New Journal
          </button>
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
              {["today", "week", "month", "custom"].map((df) => (
                <button
                  key={df}
                  className={`jr-chip ${dateFilter === df ? "is-active" : ""}`}
                  onClick={() => setDateFilter(df)}
                >
                  {df === "today"
                    ? "Today"
                    : df === "week"
                    ? "This Week"
                    : df === "month"
                    ? "This Month"
                    : "Custom Range"}
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
                    {new Date(e.createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div className="jr-card-footer">
                  <div className="jr-avatar" />
                  <span className="jr-author">{e.author || "Me"}</span>
                </div>
              </div>

              <div className="jr-card-actions" style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openModal(e)}>Edit</button>
                <button onClick={() => handleDelete(e._id)}>Delete</button>
                <button onClick={() => doMarkSynced(e._id)}>Mark Synced</button>
                <button onClick={() => runAnalyze(e)}>Analyze (AI)</button>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination đẹp + hoạt động */}
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

            {/* (tuỳ chọn) selector size */}
            {/* <select value={limit} onChange={(e)=>setLimit(+e.target.value)}>
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
            </select> */}
          </div>
        )}
      </section>

      <footer className="jr-footer">© {new Date().getFullYear()} My Journal</footer>

      {/* CREATE/EDIT MODAL + AI Suggestion box */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? "Edit Journal" : "Create New Journal"}</h2>
            <form onSubmit={handleSubmit}>
              <input
                className="modal-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Title"
                required
              />
              <textarea
                className="modal-input"
                style={{ height: "120px", resize: "vertical" }}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write your thoughts..."
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

              {/* AI Suggestion box trong modal */}
              <div className="jr-ai-box" style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Suggestions</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="modal-input"
                    style={{ maxWidth: 220 }}
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Topic (e.g. gratitude)"
                  />
                  <select
                    className="modal-input"
                    style={{ maxWidth: 160 }}
                    value={aiMood}
                    onChange={(e) => setAiMood(e.target.value)}
                  >
                    <option value="happy">happy</option>
                    <option value="sad">sad</option>
                    <option value="calm">calm</option>
                  </select>
                  <button
                    type="button"
                    className="modal-btn ghost"
                    onClick={() => runSuggestInModal(false)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Thinking..." : "Suggest (Free)"}
                  </button>
                  <button
                    type="button"
                    className="modal-btn"
                    onClick={() => runSuggestInModal(true)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Thinking..." : "Suggest+ (Premium)"}
                  </button>
                </div>

                {usage && (
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                    Plan: {usage?.data?.plan ?? "—"} • Remaining free suggests today:{" "}
                    {usage?.data?.remaining?.suggestBasic ?? "—"}
                  </div>
                )}

                {!!aiTips.length && (
                  <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                    {aiTips.map((t, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        {t}{" "}
                        <button
                          type="button"
                          className="modal-btn ghost"
                          style={{ marginLeft: 8, height: 28, padding: "0 10px" }}
                          onClick={() => insertTip(t)}
                        >
                          Insert
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="modal-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
