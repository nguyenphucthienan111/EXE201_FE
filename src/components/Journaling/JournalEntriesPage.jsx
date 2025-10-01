import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../style/Journal.css";

const moodOptions = [
  { id: "happy", label: "😊 Happy" },
  { id: "sad", label: "😢 Sad" },
  { id: "calm", label: "😌 Calm" },
];

// Dummy data để demo giống hình
const DUMMY_ENTRIES = [
  {
    id: 1,
    title: "Entry Title 1",
    excerpt: "Today I felt Joyous!",
    mood: "happy",
    date: new Date(), // hôm nay
    author: "User",
  },
  {
    id: 2,
    title: "Entry Title 2",
    excerpt: "Feeling a bit down…",
    mood: "sad",
    date: new Date(Date.now() - 2 * 864e5),
    author: "User",
  },
  {
    id: 3,
    title: "Entry Title 3",
    excerpt: "A calm and peaceful day.",
    mood: "calm",
    date: new Date(Date.now() - 12 * 864e5),
    author: "User",
  },
  {
    id: 4,
    title: "Entry Title 1",
    excerpt: "Today I felt Joyous!",
    mood: "happy",
    date: new Date(Date.now() - 15 * 864e5),
    author: "User",
  },
  {
    id: 5,
    title: "Entry Title 2",
    excerpt: "Feeling a bit down…",
    mood: "sad",
    date: new Date(Date.now() - 18 * 864e5),
    author: "User",
  },
  {
    id: 6,
    title: "Entry Title 3",
    excerpt: "A calm and peaceful day.",
    mood: "calm",
    date: new Date(Date.now() - 20 * 864e5),
    author: "User",
  },
];

export default function JournalEntriesPage() {
  const [topSearch, setTopSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // today | week | month | custom
  const [moods, setMoods] = useState([]);

  const toggleMood = (id) => {
    setMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

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

    return DUMMY_ENTRIES.filter((e) => {
      const byDate = e.date >= start;
      const byMood = moods.length ? moods.includes(e.mood) : true;
      const byKw = kw
        ? (e.title + " " + e.excerpt).toLowerCase().includes(kw)
        : true;
      return byDate && byMood && byKw;
    });
  }, [keyword, topSearch, dateFilter, moods]);

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

        {/* Nút sang trang chọn template */}
        <div style={{ marginTop: "20px" }}>
          <Link to="/journal/templates" className="jr-btn">
            + Create New Journal
          </Link>
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
              <button
                className={`jr-chip ${
                  dateFilter === "today" ? "is-active" : ""
                }`}
                onClick={() => setDateFilter("today")}
              >
                Today
              </button>
              <button
                className={`jr-chip ${
                  dateFilter === "week" ? "is-active" : ""
                }`}
                onClick={() => setDateFilter("week")}
              >
                This Week
              </button>
              <button
                className={`jr-chip ${
                  dateFilter === "month" ? "is-active" : ""
                }`}
                onClick={() => setDateFilter("month")}
              >
                This Month
              </button>
              <button
                className={`jr-chip ${
                  dateFilter === "custom" ? "is-active" : ""
                }`}
                onClick={() => setDateFilter("custom")}
              >
                Custom Range
              </button>
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
        <div className="jr-grid">
          {filtered.map((e) => (
            <article key={e.id} className="jr-card">
              <div className="jr-thumb" />
              <div className="jr-card-body">
                <h4 className="jr-card-title">{e.title}</h4>
                <p className="jr-card-excerpt">{e.excerpt}</p>
                <div className="jr-card-meta">
                  {/* phù hợp ảnh: emoji trong chip nhỏ */}
                  <span className={`jr-mood ${e.mood}`}>{e.mood}</span>
                </div>
                <div className="jr-card-footer">
                  <div className="jr-avatar" />
                  <span className="jr-author">{e.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="jr-footer">
        © {new Date().getFullYear()} My Journal
      </footer>
    </div>
  );
}
