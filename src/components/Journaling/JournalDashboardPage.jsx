// src/components/Journaling/JournalDashboardPage.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboard,
  improvementPlan,
  getJournals,
} from "../../services/journalService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "../style/Journal.css";

export default function JournalDashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState({ journalStats: [], moodTrends: [] });
  const [plan, setPlan] = useState(null);
  const [focusAreas, setFocusAreas] = useState(["anxiety"]);
  const [duration, setDuration] = useState(7);
  const [errorMsg, setErrorMsg] = useState("");

  // Recent journals (để Continue / Edit nhanh)
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getDashboard({ period });
      const data = res?.data || res || {};
      setStats({
        journalStats: Array.isArray(data.journalStats) ? data.journalStats : [],
        moodTrends: Array.isArray(data.moodTrends) ? data.moodTrends : [],
      });
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMsg(
          e?.response?.data?.message || e?.message || "Failed to load dashboard"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [period, navigate]);

  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const list = await getJournals({ page: 1, limit: 50 });
      const arr = Array.isArray(list) ? list : [];
      // Sort mới nhất trước
      arr.sort((a, b) => {
        const atA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const atB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return atB - atA;
      });
      setRecent(arr.slice(0, 5));
    } catch (e) {
      console.error("Failed to load recent journals:", e);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  async function loadPlan() {
    setErrorMsg("");
    try {
      const res = await improvementPlan({ focusAreas, duration });
      setPlan(res?.data || res || null);
    } catch (e) {
      setErrorMsg(
        e?.response?.data?.message || e?.message || "Failed to load plan"
      );
    }
  }

  const noBarData = !stats.journalStats?.length;
  const noLineData = !stats.moodTrends?.length;

  // Đảm bảo xoá đúng key token
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Entry mới nhất để Continue
  const latestEntry = useMemo(
    () => (recent && recent.length ? recent[0] : null),
    [recent]
  );

  const goContinue = () => {
    if (!latestEntry?._id) {
      // Nếu chưa có entry nào → chuyển sang trang Journal list để tạo
      navigate("/journal");
      return;
    }
    navigate(`/journals/${latestEntry._id}/edit`);
  };

  return (
    <div className="jr-root">
      {/* Topbar */}
      <header className="jr-topbar">
        <div className="jr-logo">MyJournal</div>
        <h1>Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="jr-btn ghost" onClick={() => navigate("/journal")}>
            + New Journal
          </button>
          <button className="jr-btn ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Quick actions */}
      <section
        className="jr-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Jump back in</h3>
          <p style={{ margin: "4px 0", color: "#6b7280" }}>
            Continue your most recent journal or create a new one.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="jr-btn"
            onClick={goContinue}
            disabled={loadingRecent}
          >
            {loadingRecent
              ? "Loading…"
              : latestEntry
              ? "Continue Writing"
              : "Start Writing"}
          </button>
          <button className="jr-btn ghost" onClick={() => navigate("/journal")}>
            Open Journal List
          </button>
        </div>
      </section>

      {/* Period Filter */}
      <div className="jr-filter">
        <label>Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="jr-select"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {/* Loading / Error */}
      {loading && <div className="jr-empty">Loading dashboard…</div>}
      {!loading && errorMsg && <div className="jr-alert error">{errorMsg}</div>}

      {/* Content */}
      {!loading && !errorMsg && (
        <div className="jr-container">
          {/* Charts */}
          <section className="jr-grid-2">
            <ChartCard title="Journal Stats">
              {noBarData ? (
                <div className="jr-empty">No data for this period.</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={stats.journalStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Entries" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Mood Trends">
              {noLineData ? (
                <div className="jr-empty">No mood data for this period.</div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={stats.moodTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="happy"
                      stroke="#22c55e"
                      name="Happy"
                    />
                    <Line
                      type="monotone"
                      dataKey="sad"
                      stroke="#8b5cf6"
                      name="Sad"
                    />
                    <Line
                      type="monotone"
                      dataKey="calm"
                      stroke="#f59e0b"
                      name="Calm"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </section>

          {/* Recent Journals */}
          <section className="jr-card" style={{ marginTop: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0 }}>Recent Journals</h3>
              <button
                className="jr-btn ghost"
                onClick={loadRecent}
                disabled={loadingRecent}
              >
                {loadingRecent ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {!loadingRecent && recent.length === 0 && (
              <div className="jr-empty" style={{ marginTop: 10 }}>
                No recent entries. Click <strong>“+ New Journal”</strong> to
                start writing.
              </div>
            )}

            {!!recent.length && (
              <div className="jr-list">
                {recent.map((e) => (
                  <div key={e._id} className="jr-list-item">
                    <div className="jr-list-meta">
                      <div className="jr-list-title">
                        {e.title || "Untitled"}
                      </div>
                      <div className="jr-list-sub">
                        <span className={`jr-mood ${e.mood}`}>{e.mood}</span>
                        <span style={{ marginLeft: 8, opacity: 0.75 }}>
                          {new Date(
                            e.updatedAt || e.createdAt || Date.now()
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className="jr-list-actions"
                      style={{ display: "flex", gap: 8 }}
                    >
                      {/* 🔽 Nút viết tiếp (mở trang editor) */}
                      <button
                        className="jr-btn"
                        onClick={() => navigate(`/journals/${e._id}/edit`)}
                      >
                        Continue Writing
                      </button>
                      {/* Tuỳ chọn: mở danh sách nếu muốn quick edit trong list */}
                      {/* <button className="jr-btn ghost" onClick={() => navigate("/journal")}>Open in List</button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Improvement Plan */}
          <section className="jr-card" style={{ marginTop: 32 }}>
            <h3>Personalized Improvement Plan</h3>
            <div className="jr-form-row">
              <input
                value={focusAreas.join(",")}
                onChange={(e) =>
                  setFocusAreas(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Focus areas (comma separated)"
                className="jr-input"
              />
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) =>
                  setDuration(Math.max(1, Number(e.target.value)))
                }
                className="jr-input"
              />
              <button className="jr-btn" onClick={loadPlan}>
                Generate Plan
              </button>
            </div>
            {plan && (
              <div className="jr-plan">
                <h4>Focus Areas: {plan.focusAreas?.join(", ")}</h4>
                <p>Duration: {plan.duration ?? duration} days</p>
                <ul>
                  {(plan.steps || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      <footer className="jr-footer">
        © {new Date().getFullYear()} My Journal
      </footer>
    </div>
  );
}

/* Reusable */
// eslint-disable-next-line react/prop-types
function ChartCard({ title, children }) {
  return (
    <div className="jr-card">
      <h3>{title}</h3>
      <div style={{ height: 300 }}>{children}</div>
    </div>
  );
}
