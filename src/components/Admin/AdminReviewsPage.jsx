import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAdminReviews,
  toggleReviewVisibility,
  getReviewStats,
} from "../../services/adminReviewService";
import "../style/AdminReviews.css"; // giữ import CSS

const STAR_OPTIONS = [5, 4, 3, 2, 1];

export default function AdminReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- URL <-> State
  const ratingFromUrl = searchParams.get("rating");
  const [ratingFilter, setRatingFilter] = useState(
    ratingFromUrl ? Number(ratingFromUrl) : null
  );

  // ---- Data states
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // đang toggle item nào
  const [pendingId, setPendingId] = useState(null);

  // Đồng bộ state -> URL (không hỏi BE ở đây)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (ratingFilter) next.set("rating", String(ratingFilter));
    else next.delete("rating");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  // Gọi API (mỗi khi ratingFilter đổi hoặc khi mount)
  async function loadData() {
    setLoading(true);
    setErrMsg("");
    try {
      // gọi đúng spec: GET /api/reviews/admin?visibility=all&rating=<...>&page=1&limit=50
      const res = await getAdminReviews({
        page: 1,
        limit: 50,
        visibility: "all",
        ...(ratingFilter ? { rating: ratingFilter } : {}),
      });

      const list = Array.isArray(res?.reviews) ? res.reviews : [];
      const normalized = list.map((r) => ({
        ...r,
        _id: r._id || r.id,
      }));
      setReviews(normalized);

      // stats
      const st = await getReviewStats();
      setStats(st || res?.statistics || null);
    } catch (err) {
      console.error("Admin reviews error:", err);
      if (err?.message === "NOT_JSON_RESPONSE") {
        setErrMsg(
          "API returned HTML (not JSON). Check Vite proxy /api → backend & admin token."
        );
      } else {
        setErrMsg(
          err?.response?.data?.message ||
            "Failed to load data. Check backend / admin permission / token."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  async function handleToggle(id, isVisible) {
    if (!id) return;
    setPendingId(id);
    // optimistic update
    setReviews((prev) =>
      prev.map((r) => (r._id === id ? { ...r, isVisible: !isVisible } : r))
    );
    try {
      await toggleReviewVisibility(id, !isVisible);
    } catch (err) {
      // rollback
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isVisible } : r))
      );
      alert(err?.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setPendingId(null);
    }
  }

  const emptyMessage = useMemo(() => {
    if (loading || errMsg) return "";
    if (reviews.length) return "";
    return ratingFilter
      ? `No reviews with filter ${ratingFilter}★`
      : "No reviews found";
  }, [reviews.length, loading, ratingFilter, errMsg]);

  return (
    <div className="admin-reviews">
      <div className="ar-head">
        <h1>Review Management</h1>
        <div className="ar-actions">
          <button className="btn btn--ghost" onClick={loadData} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errMsg && (
        <div className="ar-alert" role="alert">
          <div className="ar-alert__title">Failed to load data</div>
          <div className="ar-alert__text">{errMsg}</div>
          <div className="ar-alert__tip">
            Checklist: check <code>vite.config.js</code> proxy{" "}
            <code>/api → http://localhost:5000</code>, login as admin (token/cookie),
            call <code>GET /api/reviews/admin</code>.
          </div>
          <div className="ar-alert__actions">
            <button className="btn btn--primary" onClick={loadData}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && !errMsg && (
        <div className="ar-stats">
          <StatBox label="Total reviews" value={stats.totalReviews} tone="indigo" />
          <StatBox label="Visible" value={stats.visibleReviews} tone="green" />
          <StatBox label="Hidden" value={stats.hiddenReviews} tone="red" />
          <StatBox
            label="Avg. Rating"
            value={`${(stats.averageRating ?? 0).toFixed(1)} ★`}
            tone="yellow"
          />
        </div>
      )}

      {/* Star filter */}
      <div className="ar-filter">
        <span className="ar-filter__label">Filter by stars:</span>
        <div className="ar-filter__group">
          {STAR_OPTIONS.map((s) => {
            const active = ratingFilter === s;
            return (
              <button
                key={s}
                onClick={() => setRatingFilter(active ? null : s)}
                className={`ar-badge ${active ? "is-active" : ""}`}
                aria-pressed={active}
              >
                {s} ★
              </button>
            );
          })}
          <button
            onClick={() => setRatingFilter(null)}
            className={`ar-badge ${ratingFilter == null ? "is-active" : ""}`}
            title="Clear filter"
          >
            All
          </button>
        </div>
      </div>

      {/* Reviews table */}
      {loading ? (
        <p className="ar-loading">Loading…</p>
      ) : (
        <div className="ar-tablewrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.userId?.email || r.user?.email || "—"}</td>
                  <td className="ar-strong">{r.rating} ★</td>
                  <td className="ar-feedback">{r.feedback}</td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                  <td>
                    {r.isVisible ? (
                      <span className="tag tag--green">Visible</span>
                    ) : (
                      <span className="tag tag--red">Hidden</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn--primary"
                      onClick={() => handleToggle(r._id, r.isVisible)}
                      disabled={pendingId === r._id}
                    >
                      {pendingId === r._id
                        ? "Updating…"
                        : r.isVisible
                        ? "Hide"
                        : "Show"}
                    </button>
                  </td>
                </tr>
              ))}
              {!reviews.length && !errMsg && (
                <tr>
                  <td colSpan={6} className="ar-empty">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line react/prop-types
function StatBox({ label, value, tone }) {
  return (
    <div className={`ar-stat ar-stat--${tone}`}>
      <div className="ar-stat__label">{label}</div>
      <div className="ar-stat__value">{value}</div>
    </div>
  );
}
