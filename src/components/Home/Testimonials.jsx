import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicReviews } from "../../services/reviewService";
import "../style/Testimonials.css";

// eslint-disable-next-line react/prop-types
function Stars({ value = 0 }) {
  const n = Math.round(Number(value) || 0);
  return (
    <span className="review__stars" aria-label={`${n} stars`}>
      {"★★★★★".slice(0, n).padEnd(5, "☆")}
    </span>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // BE có hỗ trợ limit; nếu không thì vẫn slice(0,2) ở FE
        const res = await getPublicReviews({ limit: 2, skip: 0 });
        // chấp nhiều kiểu payload: {success,data:{reviews}} | {reviews} | []
        const data = res?.data ?? res ?? {};
        const list = Array.isArray(data.reviews) ? data.reviews : Array.isArray(res) ? res : [];
        setItems(list.slice(0, 2));
      } catch (e) {
        console.error("Load public reviews failed:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="testimonials">
      <div className="tms__container">
        {/* Left column */}
        <div className="tms__intro">
          <h2 className="tms__title">What Our Users Say</h2>
          <p className="tms__subtitle">
            Hear from others who have transformed their journaling.
          </p>

          <Link to="/reviews" className="tms__cta">
            See More Reviews
          </Link>
        </div>

        {/* Right column */}
        <div className="tms__list">
          {loading ? (
            <>
              <article className="review review--skeleton" aria-hidden />
              <article className="review review--skeleton" aria-hidden />
            </>
          ) : items.length ? (
            items.map((r) => (
              <article key={r._id || r.id} className="review">
                <header className="review__head">
                  <div className="review__avatar" aria-hidden />
                  <div className="review__meta">
                    <strong>{r.userName || r.user?.name || r.userId?.name || "Anonymous"}</strong>
                    <div className="review__date">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </header>
                <p className="review__text">{r.feedback}</p>
              </article>
            ))
          ) : (
            <p className="tms__empty">No reviews yet. Be the first to share!</p>
          )}
        </div>
      </div>
    </section>
  );
}
