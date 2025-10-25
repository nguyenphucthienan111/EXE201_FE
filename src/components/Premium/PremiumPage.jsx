// src/components/Pricing.jsx
import { useEffect, useState, useRef } from "react";
import "../style/Premium.css";
import {
  createPremiumPayment,
  getPremiumPaymentStatus,
  checkUserPlan,
  resetPremiumPending,
} from "../../services/paymentService";
import PropTypes from "prop-types";

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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState("");

  // 'free' | 'premium'
  const [plan, setPlan] = useState("free");

  // pending info từ BE
  const [status, setStatus] = useState({
    hasActivePayment: false,
    paymentExpired: true,
    timeLeft: 0,
    paymentUrl: "",
  });

  const pollRef = useRef(null);

  async function fetchAll() {
    setErr("");
    try {
      setLoading(true);
      const [planRes, sttRes] = await Promise.all([
        checkUserPlan().catch(() => null),
        getPremiumPaymentStatus().catch(() => null),
      ]);

      // BE có thể trả data.currentPlan hoặc data.plan
      const nextPlan =
        planRes?.data?.currentPlan ||
        planRes?.data?.plan ||
        planRes?.currentPlan ||
        planRes?.plan ||
        "free";
      setPlan(nextPlan);

      if (sttRes?.data) setStatus((s) => ({ ...s, ...sttRes.data }));
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load payment status.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();

    // Poll nhẹ để cập nhật timeLeft/paymentUrl khi đang pending
    pollRef.current = setInterval(async () => {
      try {
        const sttRes = await getPremiumPaymentStatus();
        if (sttRes?.data) setStatus((s) => ({ ...s, ...sttRes.data }));
      } catch {
        /* ignore */
      }
    }, 8000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const gotoPayment = (url) => {
    if (url) window.location.href = url; // redirect sang cổng thanh toán
  };

  // Luôn tạo đơn mới và LƯU paymentId+orderCode để trang /payment/success xác nhận
  const resumeOrCreate = async () => {
    setErr("");
    setActionLoading(true);
    try {
      // Nếu đang có pending link hợp lệ -> reset để chắc chắn tạo link mới
      const sttRes = await getPremiumPaymentStatus().catch(() => null);
      const latest = sttRes?.data || {};
      if (latest.hasActivePayment && !latest.paymentExpired) {
        try {
          await resetPremiumPending();
        } catch {
          /* ignore lỗi reset */
        }
      }

      // Tạo link mới
      const createRes = await createPremiumPayment();
      const url = createRes?.data?.paymentUrl;
      const paymentId = createRes?.data?.paymentId;
      const orderCode = createRes?.data?.orderCode;

      // LƯU để /payment/success xác nhận qua /payments/confirm/:paymentId
      if (paymentId || orderCode) {
        localStorage.setItem(
          "pendingPayment",
          JSON.stringify({
            paymentId: paymentId || "",
            orderCode: orderCode || "",
            ts: Date.now(),
          })
        );
      }

      if (url) {
        gotoPayment(url);
        return;
      }

      setErr("Cannot create a fresh payment link right now. Please try again.");
      await fetchAll();
    } catch (e) {
      const m =
        e?.response?.data?.message || e?.message || "Could not start payment.";
      setErr(m);
    } finally {
      setActionLoading(false);
    }
  };

  const onUpgrade = async () => {
    setErr("");
    setActionLoading(true);
    try {
      if (plan === "premium") return;
      await resumeOrCreate();
    } finally {
      setActionLoading(false);
    }
  };

  const onResetPending = async () => {
    setErr("");
    setActionLoading(true);
    try {
      await resetPremiumPending();
      await fetchAll();
    } catch (e) {
      const m = e?.response?.data?.message || e?.message || "Reset failed.";
      setErr(m);
    } finally {
      setActionLoading(false);
    }
  };

  const timeLeftText =
    status?.timeLeft && status.timeLeft > 0
      ? `${Math.ceil(status.timeLeft / 60)} min left`
      : "";

  return (
    <div className="prx-root">
      {/* Hero */}
      <section className="prx-hero">
        <div className="prx-chip">Pricing</div>
        <h1>Upgrade your journaling experience</h1>
        <p>
          Powerful AI features, clear insights and a calm, focused writing flow.
        </p>

        {loading ? (
          <div className="prx-note">Loading payment status…</div>
        ) : (
          <>
            {err && <div className="prx-note error">{err}</div>}
            {plan === "premium" && (
              <div className="prx-note success">
                You’re on <b>Premium</b>. Thank you! 🎉
              </div>
            )}
            {plan !== "premium" &&
              status.hasActivePayment &&
              !status.paymentExpired && (
                <div className="prx-note">
                  You have a pending payment.{" "}
                  {timeLeftText && <b>{timeLeftText}</b>}{" "}
                  <button
                    className="prx-inline-btn"
                    onClick={resumeOrCreate}
                    disabled={actionLoading || loading}
                  >
                    Continue payment
                  </button>
                  <button
                    className="prx-inline-btn ghost"
                    onClick={onResetPending}
                    disabled={actionLoading || loading}
                  >
                    Reset
                  </button>
                </div>
              )}
          </>
        )}
      </section>

      {/* Cards */}
      <section className="prx-grid">
        {/* Free */}
        <article className="prx-card">
          <header className="prx-card-head">
            <h3>Free</h3>
            <div className="prx-price">
              <span className="prx-price-main">0₫</span>
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
            {plan === "free" ? (
              <span
                className="prx-btn ghost"
                style={{
                  pointerEvents: "none",
                  cursor: "default",
                  opacity: 0.7,
                }}
                aria-disabled="true"
              >
                Your current plan
              </span>
            ) : null}
          </div>
        </article>

        {/* Pro */}
        <article className="prx-card pro">
          <div className="prx-badge">Most Popular</div>

          <header className="prx-card-head">
            <h3>Pro</h3>
            <div className="prx-price">
              {plan === "premium" ? (
                <>
                  <span className="prx-price-main">
                    <span className="prx-price-strike">41.000₫</span>
                    <span className="prx-price-now">0₫</span>
                  </span>
                  <span className="prx-price-unit">/month</span>
                </>
              ) : (
                <>
                  <span className="prx-price-main">41.000₫</span>
                  <span className="prx-price-unit">/month</span>
                </>
              )}
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
            {plan === "premium" ? (
              <div className="prx-actions-col">
                <span
                  className="prx-btn primary current"
                  style={{ pointerEvents: "none", cursor: "default" }}
                  aria-disabled="true"
                >
                  Your current plan
                </span>
                {/* Nếu muốn hiển thị ngày hết hạn, thêm field từ BE và render ở đây */}
              </div>
            ) : (
              <button
                className="prx-btn primary"
                onClick={onUpgrade}
                disabled={actionLoading || loading}
              >
                {actionLoading
                  ? "Processing…"
                  : status.hasActivePayment && !status.paymentExpired
                  ? "Continue payment"
                  : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </article>
      </section>

      {/* Why us */}
      <section className="prx-why">
        <h2>Why choose us</h2>
        <div className="prx-why-grid">
          <WhyItem
            emoji="🔒"
            title="Private by design"
            text="Your entries are encrypted in transit and at rest."
          />
          <WhyItem
            emoji="⚡"
            title="Fast & reliable"
            text="Snappy editor with autosave and offline tolerance."
          />
          <WhyItem
            emoji="🎯"
            title="Built for clarity"
            text="Actionable insights, not noisy dashboards."
          />
        </div>
      </section>
    </div>
  );
}

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

WhyItem.propTypes = {
  emoji: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="prx-check"
    >
      <path
        d="M20 7L9 18l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
