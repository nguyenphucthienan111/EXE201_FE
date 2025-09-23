import "../style/Testimonials.css";

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="tms__container">
        {/* Left column */}
        <div className="tms__intro">
          <h2 className="tms__title">What Our users Say</h2>
          <p className="tms__subtitle">
            Hear from others who have transformed their journaling.
          </p>
          <button className="tms__cta">See More Reviews</button>
        </div>

        {/* Right column */}
        <div className="tms__list">
          <article className="review">
            <header className="review__head">
              <div className="review__avatar" aria-hidden />
              <div className="review__meta">
                <strong>Phu</strong>
              </div>
              <div className="review__stars" aria-label="5 stars">★★★★★</div>
            </header>
            <p className="review__text">
              This app has changed the way I think about my emotions!
            </p>
          </article>

          <article className="review">
            <header className="review__head">
              <div className="review__avatar" aria-hidden />
              <div className="review__meta">
                <strong>Phong</strong>
              </div>
              <div className="review__stars" aria-label="5 stars">★★★★★</div>
            </header>
            <p className="review__text">
              I love how simple and insightful it is!
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
