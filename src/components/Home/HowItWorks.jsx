import "../style/HowItWorks.css";

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="hiw__container">
        <h2 className="hiw__title">How It Works</h2>
        <p className="hiw__subtitle">
          Discover the features that enhance your journaling experience.
        </p>

        <button className="hiw__cta">Learn More</button>

        <div className="hiw__grid">
          <div className="hiw-card">
            <div className="hiw-card__icon">
              <img src="/web.png" alt="" />
            </div>
            <div className="hiw-card__body">
              <h3 className="hiw-card__title">Simple Interface</h3>
              <small className="hiw-card__sub">Effortless Tracking</small>
              <p className="hiw-card__desc">
                Easily log your daily mood with just a few clicks.
              </p>
            </div>
          </div>

          <div className="hiw-card">
            <div className="hiw-card__icon">
              <img src="/insights.png" alt="" />
            </div>
            <div className="hiw-card__body">
              <h3 className="hiw-card__title">Insights & Trends</h3>
              <small className="hiw-card__sub">Understand Your Feelings</small>
              <p className="hiw-card__desc">
                Gain valuable insights about your mood patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
