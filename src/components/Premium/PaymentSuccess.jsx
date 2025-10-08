// src/pages/PaymentSuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  confirmPayment,
  getPremiumPaymentStatus,
  checkUserPlan,
} from "../../services/paymentService";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  // Query từ cổng thanh toán (tuỳ PayOS / gateway)
  const orderCode = params.get("orderCode") || params.get("id") || params.get("transId") || "";
  const gatewayStatus = params.get("status") || params.get("message") || "UNKNOWN";

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState("");
  const [sec, setSec] = useState(3);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Tải paymentId đã lưu trước khi redirect (nếu có)
    const raw = localStorage.getItem("pendingPayment");
    let paymentId = "";
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      paymentId = parsed?.paymentId || "";
    } catch {
      // ignore
    }

    const run = async () => {
      setLoading(true);
      setMsg("");

      try {
        // 1) Nếu có paymentId -> confirm trực tiếp với BE
        if (paymentId) {
          const res = await confirmPayment(paymentId);
          if (res?.success && (res?.data?.status === "success")) {
            setOk(true);
            setMsg("Payment confirmed. Upgrading your plan…");
            // dọn local
            localStorage.removeItem("pendingPayment");
            // đếm ngược về /premium
            const timer = setTimeout(() => navigate("/premium", { replace: true }), 3000);
            return () => clearTimeout(timer);
          }
          // Nếu confirm trả về pending/unknown thì rơi xuống bước 2
        }

        // 2) Không có paymentId hoặc vẫn pending -> kiểm tra trạng thái pending link
        const stt = await getPremiumPaymentStatus().catch(() => null);
        const sdata = stt?.data || {};
        if (sdata.hasActivePayment && !sdata.paymentExpired) {
          setPending(true);
          setMsg("Your payment is still processing. Please wait or refresh.");
          setOk(false);
          return;
        }

        // 3) Nếu không còn pending ở server -> có thể đã lên premium
        const planRes = await checkUserPlan().catch(() => null);
        const plan = planRes?.data?.currentPlan || planRes?.data?.plan;
        if (plan === "premium") {
          setOk(true);
          setMsg("Your plan is now Premium. Redirecting…");
          localStorage.removeItem("pendingPayment");
          const timer = setTimeout(() => navigate("/premium", { replace: true }), 2000);
          return () => clearTimeout(timer);
        }

        // 4) Không premium, không pending -> coi như thất bại/tạm thời chưa xác nhận được
        setOk(false);
        setPending(false);
        setMsg("We couldn’t confirm your payment yet. Please try again from the Pricing page.");
      } catch (e) {
        setOk(false);
        setPending(false);
        setMsg(e?.response?.data?.message || e?.message || "Payment confirmation failed.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate, orderCode]);

  useEffect(() => {
    if (!ok) return;
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [ok]);

  return (
    <div style={{ padding: "64px 0" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(17,12,46,0.08)",
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
            background: ok ? "#e8f7ed" : "#fff7ed",
            color: ok ? "#16a34a" : "#fb923c",
            fontWeight: 800,
            fontSize: 28,
            lineHeight: "56px",
          }}
          aria-hidden="true"
        >
          {ok ? "✓" : pending ? "…" : "!"}
        </div>

        <h1 style={{ margin: "8px 0 4px" }}>
          {loading
            ? "Verifying payment…"
            : ok
            ? "Payment successful"
            : pending
            ? "Payment pending"
            : "Payment not confirmed"}
        </h1>

        <p style={{ margin: 0, color: "#6b7280" }}>
          Gateway status: <b>{gatewayStatus}</b>
          {orderCode ? (
            <>
              {" "}• Order: <code>{orderCode}</code>
            </>
          ) : null}
        </p>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

        {ok && (
          <p style={{ color: "#16a34a", marginTop: 6 }}>
            Redirecting to <b>Premium</b> in <b>{sec}s</b>…
          </p>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="prx-btn primary" onClick={() => navigate("/premium", { replace: true })}>
            Go to Premium
          </button>
          <a className="prx-btn ghost" href="/contact">Need help?</a>
        </div>
      </div>
    </div>
  );
}
