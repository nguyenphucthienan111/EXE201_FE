import "../style/ExploreFeatures.css";

export default function ExploreFeatures() {
  return (
    <section className="explore">
      <div className="explore__container">
        <h2 className="explore__title">Explore Our Features</h2>
        <p className="explore__subtitle">
          Tools that empower you to reflect and grow.
        </p>

        <button className="explore__cta">See Features</button>

        <div className="explore__grid">
          <div className="explore-card">
            <img src="/mood.png" alt="Mood Tracker" />
            <h3 className="explore-card__title">Mood Tracker</h3>
            <p className="explore-card__desc">Track your mood effortlessly.</p>
          </div>

          <div className="explore-card">
            <img src="/reminder.png" alt="Daily Reminders" />
            <h3 className="explore-card__title">Daily Reminders</h3>
            <p className="explore-card__desc">Get gentle nudges to journal.</p>
          </div>

          <div className="explore-card">
            <img src="/insights.png" alt="Mood Insights" />
            <h3 className="explore-card__title">Mood Insights</h3>
            <p className="explore-card__desc">
              Visualize your emotional journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
