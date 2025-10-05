// src/pages/PaymentSuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  // Có thể có các query từ cổng thanh toán: code, id, status, orderCode, ...
  const status = params.get("status") || params.get("message") || "SUCCESS";
  const orderCode =
    params.get("orderCode") || params.get("id") || params.get("transId");

  const [sec, setSec] = useState(5);

  useEffect(() => {
    window.scrollTo(0, 0);

    const tick = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    const to = setTimeout(() => navigate("/premium", { replace: true }), 5000);

    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [navigate]);

  return (
    <div style={{ padding: "64px 0" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(17, 12, 46, 0.08)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            margin: "0 auto 12px",
            display: "grid",
            placeItems: "center",
            background: "#e8f7ed",
            color: "#16a34a",
            fontWeight: 800,
            fontSize: 28,
            lineHeight: "56px",
          }}
          aria-hidden="true"
        >
          ✓
        </div>

        <h1 style={{ margin: "8px 0 4px" }}>Payment successful</h1>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Thank you! Your account has been upgraded. You will be redirected to{" "}
          <b>Premium</b> in <b>{sec}s</b>.
        </p>

        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 14 }}>
          <div>
            Status: <b>{status}</b>
          </div>
          {orderCode && (
            <div>
              Order code: <code>{orderCode}</code>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            className="prx-btn primary"
            onClick={() => navigate("/premium", { replace: true })}
          >
            Go back now
          </button>
          <a className="prx-btn ghost" href="/contact">
            Need help?
          </a>
        </div>
      </div>
    </div>
  );
}
