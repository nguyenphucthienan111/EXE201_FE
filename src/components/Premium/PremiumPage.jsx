import { useMemo, useState } from "react";
import "../style/Premium.css";

const featuresFree = [
  "Daily diary (1–2 posts/day)",
  "Mood tracking calendar",
  "Basic AI writing prompts",
  "Manual wellness index (1–10)",
];

const featuresPro = [
  "Advanced AI sentiment analysis",
  "Personal AI assistant",
  "Smart topic suggestions",
  "Insights dashboard & trends",
  "Personalized improvement plan",
  "Priority support",
];

export default function Pricing() {
  // toggle Monthly / Yearly (-20%)
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'yearly'

  const prices = useMemo(() => {
    const base = 7.99;
    const pro = billing === "monthly" ? base : Math.round(base * 2 * 0.8 * 100) / 100;
    const unit = billing === "monthly" ? "/6 month" : "/year";
    return { pro, unit };
  }, [billing]);

  return (
    <div className="prx-root">
      {/* Hero */}
      <section className="prx-hero">
        <div className="prx-chip">Pricing</div>
        <h1>Upgrade your journaling experience</h1>
        <p>Powerful AI features, clear insights and a calm, focused writing flow.</p>

        {/* Billing Toggle */}
        <div className="prx-toggle" role="tablist" aria-label="Billing period">
          <button
            role="tab"
            aria-selected={billing === "monthly"}
            className={`prx-seg ${billing === "monthly" ? "is-active" : ""}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            role="tab"
            aria-selected={billing === "yearly"}
            className={`prx-seg ${billing === "yearly" ? "is-active" : ""}`}
            onClick={() => setBilling("yearly")}
          >
            Yearly <span className="prx-save">Save 20%</span>
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="prx-grid">
        {/* Free */}
        <article className="prx-card">
          <header className="prx-card-head">
            <h3>Free</h3>
            <div className="prx-price">
              <span className="prx-price-main">$0</span>
              <span className="prx-price-unit">/forever</span>
            </div>
          </header>

          <ul className="prx-list">
            {featuresFree.map((f) => (
              <li key={f}>
                <CheckIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="prx-actions">
            <a className="prx-btn ghost" href="/signup">Get started free</a>
          </div>
        </article>

        {/* Pro */}
        <article className="prx-card pro">
          <div className="prx-badge">Most Popular</div>

          <header className="prx-card-head">
            <h3>Pro</h3>
            <div className="prx-price">
              <span className="prx-price-main">
                ${prices.pro.toFixed(2)}
              </span>
              <span className="prx-price-unit">{prices.unit}</span>
            </div>
          </header>

          <ul className="prx-list">
            {featuresPro.map((f) => (
              <li key={f}>
                <CheckIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="prx-actions">
            <a className="prx-btn primary" href="/checkout">Upgrade to Pro</a>
            <p className="prx-fine">Cancel anytime. 14-day money-back guarantee.</p>
          </div>
        </article>
      </section>

      {/* Why us */}
      <section className="prx-why">
        <h2>Why choose us</h2>
        <div className="prx-why-grid">
          <WhyItem emoji="🔒" title="Private by design" text="Your entries are encrypted in transit and at rest." />
          <WhyItem emoji="⚡" title="Fast & reliable" text="Snappy editor with autosave and offline tolerance." />
          <WhyItem emoji="🎯" title="Built for clarity" text="Actionable insights, not noisy dashboards." />
        </div>
      </section>
    </div>
  );
}

// eslint-disable-next-line react/prop-types
function WhyItem({ emoji, title, text }) {
  return (
    <div className="prx-why-item">
      <div className="prx-why-emoji">{emoji}</div>
      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
      className="prx-check">
      <path d="M20 7L9 18l-5-5" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
