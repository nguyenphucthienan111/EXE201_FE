// src/components/Journaling/JournalDashboardPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, improvementPlan } from "../../services/journalService";
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

  const [stats, setStats] = useState({
    journalStats: [],
    moodTrends: [],
  });

  const [plan, setPlan] = useState(null);
  const [focusAreas, setFocusAreas] = useState(["anxiety"]);
  const [duration, setDuration] = useState(7);
  const [errorMsg, setErrorMsg] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getDashboard({ period });
      // Backend mình giả định trả { success, data: { journalStats: [], moodTrends: [] } }
      const data = res?.data || res || {};
      setStats({
        journalStats: Array.isArray(data.journalStats) ? data.journalStats : [],
        moodTrends: Array.isArray(data.moodTrends) ? data.moodTrends : [],
      });
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMsg(e?.response?.data?.message || e?.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [period, navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function loadPlan() {
    setErrorMsg("");
    try {
      const res = await improvementPlan({ focusAreas, duration });
      setPlan(res?.data || res || null);
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || "Failed to load plan");
    }
  }

  const noBarData = !stats.journalStats?.length;
  const noLineData = !stats.moodTrends?.length;

  return (
    <div className="jr-root">
      <section className="jr-hero">
        <h1>Journal Dashboard</h1>
        <p>See your writing stats and mood insights.</p>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto 18px", padding: "0 16px" }}>
        <label style={{ marginRight: 10, fontWeight: 700, color: "#7a6bb0" }}>Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="modal-input"
          style={{ maxWidth: 220 }}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {loading && (
        <div className="jr-empty" style={{ maxWidth: 480 }}>
          Loading dashboard…
        </div>
      )}

      {!loading && errorMsg && (
        <div className="jr-empty" style={{ borderColor: "#ffe0e0", color: "#b33" }}>
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
          <h3 style={{ fontSize: 24, margin: "10px 0" }}>Journal Stats</h3>
          <div className="jr-card" style={{ height: 320, padding: 12 }}>
            {noBarData ? (
              <div className="jr-empty" style={{ boxShadow: "none", margin: "auto" }}>
                No data for this period.
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.journalStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Entries" fill="#8e7cf1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <h3 style={{ fontSize: 24, margin: "24px 0 10px" }}>Mood Trends</h3>
          <div className="jr-card" style={{ height: 320, padding: 12 }}>
            {noLineData ? (
              <div className="jr-empty" style={{ boxShadow: "none", margin: "auto" }}>
                No mood data for this period.
              </div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={stats.moodTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="happy" stroke="#4caf50" name="Happy" />
                  <Line type="monotone" dataKey="sad" stroke="#7b6cf2" name="Sad" />
                  <Line type="monotone" dataKey="calm" stroke="#ffb74d" name="Calm" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Improvement Plan */}
          <section style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 24, margin: "0 0 10px" }}>
              Personalized Improvement Plan
            </h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
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
                className="modal-input"
                style={{ maxWidth: 320 }}
              />
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                className="modal-input"
                style={{ maxWidth: 120 }}
              />
              <button className="jr-btn" onClick={loadPlan}>Generate Plan</button>
            </div>

            {plan && (
              <div className="jr-card" style={{ padding: 16 }}>
                <h4 style={{ margin: "0 0 6px" }}>
                  Focus Areas: {plan.focusAreas?.join(", ") || focusAreas.join(", ")}
                </h4>
                <p style={{ margin: "0 0 10px" }}>Duration: {plan.duration ?? duration} days</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(plan.steps || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      <footer className="jr-footer">© {new Date().getFullYear()} My Journal</footer>
    </div>
  );
}
