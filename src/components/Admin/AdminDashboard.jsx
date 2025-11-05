// src/components/Admin/AdminDashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminDashboard,
  fetchRevenueAnalytics,
  fetchSystemHealth,
  fetchAdminPayments,
} from "../../services/adminService";
import "../style/AdminDashboard.css";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import PropTypes from "prop-types";

/** Backend expects: daily | weekly | monthly | yearly */
const PERIOD_PARAM = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const [period, setPeriod] = useState("monthly");
  const [revLoading, setRevLoading] = useState(false);
  const [revErr, setRevErr] = useState("");
  const [revenue, setRevenue] = useState(null);

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthErr, setHealthErr] = useState("");

  // Payments
  const [payments, setPayments] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [payStatus, setPayStatus] = useState("");
  const [page, setPage] = useState(1);

  const stats = data?.stats || {};
  const recentSubscribers = data?.recentSubscribers || [];
  const expiringSubscriptions = data?.expiringSubscriptions || [];

  // summary hiển thị trên các thẻ nhỏ
  const revenueStats = useMemo(
    () => revenue?.data?.summary || data?.revenueStats || {},
    [revenue, data]
  );

  // series để vẽ chart (API nên trả [{label, amount}] hoặc điều chỉnh khóa bên dưới cho khớp)
  const revenueSeries = useMemo(() => {
    const trends = revenue?.data?.trends || revenue?.data?.series || [];
    return trends.map((t) => ({
      label: t._id || t.label,
      amount: t.revenue ?? t.amount ?? 0,
    }));
  }, [revenue]);

  const loadAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetchAdminDashboard();
      setData(res?.data?.data || null);
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        (e?.response?.status === 403
          ? "Access denied. Admin privileges required."
          : e?.message) ||
        "Failed to load dashboard.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenue = async (p = period) => {
    setRevErr("");
    setRevLoading(true);
    try {
      const apiPeriod = PERIOD_PARAM[p] || p;
      const res = await fetchRevenueAnalytics(apiPeriod);
      setRevenue(res?.data || null);
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load revenue analytics.";
      setRevErr(m);
    } finally {
      setRevLoading(false);
    }
  };

  const loadHealth = async () => {
    setHealthErr("");
    setHealthLoading(true);
    try {
      const res = await fetchSystemHealth();
      setHealth(res?.data?.data || null);
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load system health.";
      setHealthErr(m);
    } finally {
      setHealthLoading(false);
    }
  };

  const normalizeUser = (obj) => {
    if (!obj) return { name: null, email: null };
    const name =
      obj.name || obj.fullName || obj.username || obj.displayName || null;
    const email = obj.email || null;
    return { name, email };
  };

  const loadPayments = async () => {
    setPayErr("");
    setPayLoading(true);
    try {
      const res = await fetchAdminPayments({
        page,
        limit: 20,
        status: payStatus,
      });

      const raw = res?.data?.data?.payments || [];
      const norm = raw.map((p) => {
        const u = p.user || p.userId || {};
        const { name, email } = normalizeUser(u);
        return { ...p, __name: name, __email: email };
      });

      setPayments(norm);
    } catch (e) {
      const m =
        e?.response?.data?.message || e?.message || "Failed to load payments.";
      setPayErr(m);
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadHealth();
  }, []);
  useEffect(() => {
    loadRevenue(period);
  }, [period]);
  useEffect(() => {
    loadPayments();
  }, [payStatus, page]);

  const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString() : n ?? "—");
  const fmtRate = (r) =>
    typeof r === "number"
      ? `${r.toFixed(2)}%`
      : typeof r === "string"
      ? r
      : "—";
  const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleString();
  };

  return (
    <div className="ad-root">
      <header className="ad-header">
        <h1>Admin Dashboard</h1>
        <div className="ad-actions">
          <button
            className="ad-btn"
            onClick={() => {
              loadAll();
              loadRevenue(period);
            }}
            disabled={loading || revLoading}
          >
            {loading || revLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {err && <div className="ad-alert error">{err}</div>}

      {loading ? (
        <div className="ad-skeleton">
          <div className="ad-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ad-skel-card"></div>
            ))}
          </div>
          <div className="ad-skel-panel" style={{ marginTop: 20 }}></div>
          <div className="ad-skel-panel" style={{ marginTop: 20 }}></div>
          <div className="ad-skel-panel" style={{ marginTop: 20 }}></div>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <section className="ad-grid">
            <Card label="Total Users" value={fmtNum(stats.totalUsers)} />
            <Card label="Premium Users" value={fmtNum(stats.premiumUsers)} />
            <Card
              label="Active Premium"
              value={fmtNum(stats.activePremiumUsers)}
            />
            <Card
              label="Expiring Soon"
              value={fmtNum(stats.expiringPremiumUsers)}
            />
            <Card label="Free Users" value={fmtNum(stats.freeUsers)} />
            <Card
              label="Conversion Rate"
              value={fmtRate(stats.premiumConversionRate)}
            />
          </section>

          {/* Revenue */}
          <section className="ad-panel">
            <div className="ad-panel-head">
              <h2>Revenue</h2>
              <div className="ad-row">
                <select
                  className="ad-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={revLoading}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button
                  className="ad-btn"
                  onClick={() => loadRevenue(period)}
                  disabled={revLoading}
                >
                  {revLoading ? "Loading…" : "Reload"}
                </button>
              </div>
            </div>

            {revErr && <div className="ad-alert error">{revErr}</div>}

            {/* Summary cards */}
            {revLoading ? (
              <div
                className="ad-skel-panel"
                style={{ height: 140, marginTop: 8 }}
              />
            ) : (
              <div className="ad-revenue-grid">
                {Object.keys(revenueStats || {}).length === 0 ? (
                  <div className="ad-empty">No revenue data.</div>
                ) : (
                  Object.entries(revenueStats).map(([k, v]) => (
                    <div className="ad-rev-item" key={k}>
                      <div className="ad-rev-key">{toTitle(k)}</div>
                      <div className="ad-rev-val">
                        {typeof v === "number" ? v.toLocaleString() : String(v)}
                      </div>
                      <div className="ad-spark">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[{ val: 0 }, { val: v * 0.6 }, { val: v }]}
                          >
                            <Line
                              type="monotone"
                              dataKey="val"
                              stroke="#7c3aed"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Timeseries chart */}
            <div className="ad-panel" style={{ marginTop: 16 }}>
              {revLoading ? (
                <div className="ad-skel-panel" style={{ height: 300 }} />
              ) : revenueSeries && revenueSeries.length ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      {/* chỉnh lại dataKey cho đúng khóa trả về từ API */}
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="ad-empty">
                  No timeseries data for this period.
                </div>
              )}
            </div>
          </section>

          {/* Payments */}
          <section className="ad-panel">
            <div className="ad-panel-head">
              <h2>Payment History</h2>
              <div className="ad-row">
                <select
                  className="ad-select"
                  value={payStatus}
                  onChange={(e) => {
                    setPage(1);
                    setPayStatus(e.target.value);
                  }}
                >
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="ad-btn"
                  onClick={loadPayments}
                  disabled={payLoading}
                >
                  {payLoading ? "Loading…" : "Reload"}
                </button>
              </div>
            </div>

            {payErr && <div className="ad-alert error">{payErr}</div>}

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {!payments || payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ad-empty">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p, i) => (
                      <tr key={p._id || i}>
                        <td>{p.__name ?? "—"}</td>
                        <td>{p.__email ?? "—"}</td>
                        <td>
                          {p.amount ? p.amount.toLocaleString() + " VND" : "—"}
                        </td>
                        <td>{p.status}</td>
                        <td>{fmtDate(p.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Subscribers */}
          <section className="ad-panel">
            <div className="ad-panel-head">
              <h2>Recent Subscribers</h2>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Subscribed At</th>
                    <th>Expires At</th>
                  </tr>
                </thead>
                <tbody>
                  {!recentSubscribers || recentSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ad-empty">
                        No recent subscribers.
                      </td>
                    </tr>
                  ) : (
                    recentSubscribers.map((u, i) => (
                      <tr key={u._id || u.id || i}>
                        <td>{u.name ?? "—"}</td>
                        <td>{u.email ?? "—"}</td>
                        <td>{u.plan ?? "premium"}</td>
                        <td>{fmtDate(u.premiumStartedAt)}</td>
                        <td>{fmtDate(u.premiumExpiresAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Expiring Subscriptions */}
          <section className="ad-panel">
            <div className="ad-panel-head">
              <h2>Expiring Subscriptions</h2>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Expires At</th>
                    <th>Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {!expiringSubscriptions ||
                  expiringSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="ad-empty">
                        No expiring subscriptions.
                      </td>
                    </tr>
                  ) : (
                    expiringSubscriptions.map((u, i) => (
                      <tr key={u._id || u.id || i}>
                        <td>{u.name ?? "—"}</td>
                        <td>{u.email ?? "—"}</td>
                        <td>{fmtDate(u.premiumExpiresAt)}</td>
                        <td>{daysLeft(u.premiumExpiresAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Health */}
          <section className="ad-panel">
            <div className="ad-panel-head">
              <h2>System Health</h2>
              <button
                className="ad-btn"
                onClick={loadHealth}
                disabled={healthLoading}
              >
                {healthLoading ? "Loading…" : "Check"}
              </button>
            </div>
            {healthErr && <div className="ad-alert error">{healthErr}</div>}
            <div className="ad-health">
              <HealthItem label="Database" value={health?.database?.status} />
              <HealthItem label="AI" value={health?.ai?.status} />
              <HealthItem label="Memory" value={health?.memory?.usage} />
              <HealthItem
                label="Uptime (s)"
                value={
                  typeof health?.uptime === "number"
                    ? health.uptime.toFixed(0)
                    : "—"
                }
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- small components & helpers ---------- */
function Card({ label, value }) {
  return (
    <div className="ad-card">
      <div className="ad-card-label">{label}</div>
      <div className="ad-card-value">{value}</div>
    </div>
  );
}
Card.propTypes = { label: PropTypes.string, value: PropTypes.any };

function HealthItem({ label, value }) {
  return (
    <div className="ad-rev-item">
      <div className="ad-rev-key">{label}</div>
      <div className="ad-rev-val">{value ?? "—"}</div>
    </div>
  );
}
HealthItem.propTypes = { label: PropTypes.string, value: PropTypes.any };

function toTitle(s) {
  if (!s) return "";
  return String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}
function daysLeft(v) {
  if (!v) return "—";
  const end = new Date(v).getTime();
  if (isNaN(end)) return "—";
  const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  return `${diff}d`;
}
