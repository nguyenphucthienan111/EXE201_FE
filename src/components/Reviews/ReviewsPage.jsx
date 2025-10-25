// src/components/Reviews/ReviewsPage.jsx
import { useEffect, useState, useMemo } from "react";
import {
  getPublicReviews,
  getMyReview,
  submitReview,
} from "../../services/reviewService";
import "../style/Reviews.css";

/* ---------- Accessible Star Button ---------- */
// eslint-disable-next-line react/prop-types
function Star({
  filled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  size = 22,
  index,
}) {
  return (
    <button
      type="button"
      className="star-btn"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`Rate ${index} star${index > 1 ? "s" : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`star ${filled ? "is-filled" : ""}`}
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.245l-7.19-.61L12 2 9.19 8.635 2 9.245l5.46 4.725L5.82 21z" />
      </svg>
    </button>
  );
}

// eslint-disable-next-line react/prop-types
function Stars({ value, onChange, size = 22, compact = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value || 0;
  return (
    <div className={`stars ${compact ? "stars--compact" : ""}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        return (
          <Star
            key={n}
            index={n}
            filled={n <= display}
            onClick={onChange ? () => onChange(n) : undefined}
            onMouseEnter={onChange ? () => setHover(n) : undefined}
            onMouseLeave={onChange ? () => setHover(0) : undefined}
            size={size}
          />
        );
      })}
      {!compact && value ? (
        <span className="stars__label">{value}/5</span>
      ) : null}
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function reviewId(r) {
  return r?._id || r?.id || null;
}
function makeFallbackKey(r) {
  const txt = (r?.feedback || "").trim();
  const rating = Number(r?.rating) || 0;
  const ts = r?.createdAt
    ? new Date(r.createdAt).toISOString().slice(0, 19)
    : "";
  return `${txt}|${rating}|${ts}`;
}
function dedupeReviews(list) {
  const seen = new Map();
  for (const r of Array.isArray(list) ? list : []) {
    const id = reviewId(r);
    const key = id || makeFallbackKey(r);
    if (!seen.has(key)) seen.set(key, r);
  }
  return Array.from(seen.values());
}

/* ---------------- Page ---------------- */
export default function ReviewsPage() {
  const CARD_MAX = 720; // px
  const PAGE_SIZE = 10;

  // public list
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  // my review
  const [my, setMy] = useState(null);
  const [hasMy, setHasMy] = useState(null);
  const [loadingMy, setLoadingMy] = useState(true);

  // submit form
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Average rating is now fetched from backend

  // Danh sách công khai sau khi khử trùng lặp + ẩn review của chính mình
  const publicItems = useMemo(() => {
    const base = dedupeReviews(items);
    if (!(hasMy && my)) return base;
    const myId = reviewId(my);
    return base.filter((r) => {
      if (r?.byYou) return false; // local flag sau submit
      const rid = reviewId(r);
      if (myId && rid && myId === rid) return false;
      if (!rid && !myId) {
        // fallback so sánh gần đúng
        return makeFallbackKey(r) !== makeFallbackKey(my);
      }
      return true;
    });
  }, [items, hasMy, my]);

  /* -------- Load my review -------- */
  useEffect(() => {
    (async () => {
      try {
        setLoadingMy(true);
        const res = await getMyReview();
        const d = res?.data ?? res;

        const hasReview =
          !!d?.hasReview ||
          !!d?.review ||
          (Array.isArray(d?.reviews) && d.reviews.length > 0) ||
          !!d?._id ||
          !!d?.id;

        const review =
          d?.review || (Array.isArray(d?.reviews) ? d.reviews[0] : d) || null;

        setHasMy(!!hasReview);
        setMy(review || null);
      } catch (e) {
        if (e?.response?.status === 401) {
          setHasMy(false);
          setMy(null);
        } else {
          console.error(e);
          setHasMy(false);
        }
      } finally {
        setLoadingMy(false);
      }
    })();
  }, []);

  /* -------- Load public reviews (paged) -------- */
  async function loadMore() {
    if (loadingList || !hasMore) return;
    try {
      setLoadingList(true);
      const res = await getPublicReviews({ limit: PAGE_SIZE, skip });
      const d = res?.data ?? {};
      const list = Array.isArray(d.reviews)
        ? d.reviews
        : Array.isArray(d)
        ? d
        : [];
      setItems((prev) => dedupeReviews([...prev, ...list]));
      setSkip((prev) => prev + list.length);
      // Set total count and average rating from backend
      if (typeof d.totalCount === "number") {
        setTotalCount(d.totalCount);
      }
      if (typeof d.avgRating === "number") {
        setAvgRating(d.avgRating);
      }
      // Nếu BE không trả hasMore thì suy luận theo PAGE_SIZE
      setHasMore(
        typeof d.hasMore === "boolean" ? d.hasMore : list.length === PAGE_SIZE
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => {
    loadMore(); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Submit -------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating || !feedback.trim()) {
      alert("Please provide both rating and feedback.");
      return;
    }
    try {
      setSubmitting(true);
      await submitReview({ rating, feedback: feedback.trim() });
      // local “mine” để phản hồi realtime; bổ sung byYou flag
      const mine = {
        rating,
        feedback: feedback.trim(),
        createdAt: new Date().toISOString(),
        byYou: true,
      };
      setHasMy(true);
      setMy(mine);
      setItems((prev) => dedupeReviews([mine, ...prev]));
      setRating(5);
      setFeedback("");
      window.dispatchEvent(new CustomEvent("review:submitted"));
    } catch (err) {
      const s = err?.response?.status;
      const m =
        err?.response?.data?.message || err?.message || "Submit failed.";
      if (s === 400) {
        alert(m || "You have already submitted a review.");
        setHasMy(true);
      } else if (s === 401) {
        alert("Please login first.");
      } else {
        alert(m);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reviews">
      {/* HERO */}
      <section className="reviews-hero">
        <div className="reviews-container">
          <div className="reviews-hero__content">
            <h1>Share Your Thoughts</h1>
            <p>
              Your feedback helps us build a more delightful journaling
              experience.
            </p>
            <div className="reviews-hero__stats">
              <div className="stat">
                <div className="stat__title">Average Rating</div>
                <div className="stat__value">
                  {avgRating ? (
                    <>
                      {avgRating} <span className="stat__suffix">/ 5</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              <div className="stat">
                <div className="stat__title">Total Reviews</div>
                <div className="stat__value">{totalCount || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MY REVIEW / FORM */}
      <section className="reviews-section">
        <div className="reviews-container">
          <div className="section-head">
            <h2>Your review</h2>
          </div>

          {loadingMy ? (
            <div
              className="card skeleton"
              aria-hidden
              style={{ maxWidth: CARD_MAX, margin: "0 auto" }}
            >
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-50" />
            </div>
          ) : hasMy && my ? (
            <article
              className="card"
              style={{ maxWidth: CARD_MAX, margin: "0 auto" }}
            >
              <div className="card__body">
                <div className="card__title">Thank you for rating us!</div>
                <Stars value={my.rating} size={18} compact />
                <p className="card__text">{my.feedback}</p>
                <div className="card__meta">
                  {my.createdAt ? new Date(my.createdAt).toLocaleString() : ""}
                </div>
              </div>
            </article>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="card form"
              style={{ maxWidth: CARD_MAX, margin: "0 auto" }}
            >
              <div className="card__body">
                <div className="card__title">Leave a review</div>
                <div className="card__stars">
                  <Stars value={rating} onChange={setRating} />
                </div>

                <textarea
                  className="input textarea"
                  style={{ width: "100%" }}
                  placeholder="What do you like? What could be better?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  minLength={5}
                  rows={5}
                />

                <div className="card__actions">
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit review"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* PUBLIC REVIEWS */}
      <section className="reviews-section">
        <div className="reviews-container">
          <div className="section-head">
            <h2>What others say</h2>
          </div>

          <div
            className="grid"
            style={{ maxWidth: CARD_MAX, margin: "0 auto" }}
          >
            {publicItems.map((r, idx) => (
              <article
                key={reviewId(r) || makeFallbackKey(r) || idx}
                className="card"
              >
                <div className="card__body">
                  <Stars value={r.rating} size={16} compact />
                  <p className="card__text">{r.feedback}</p>
                  <div className="card__meta">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div
            className="loadmore"
            style={{ maxWidth: CARD_MAX, margin: "0 auto" }}
          >
            {hasMore ? (
              <button
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={loadingList}
              >
                {loadingList ? "Loading…" : "Load more"}
              </button>
            ) : publicItems.length === 0 ? (
              <span className="muted">No reviews yet.</span>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
