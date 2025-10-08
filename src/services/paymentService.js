// src/services/paymentService.js
import api from "./api";

/** Tạo payment link premium (POST /api/payments/premium) */
export async function createPremiumPayment() {
  const { data } = await api.post("/payments/premium");
  return data; // { success, data: { paymentUrl, paymentId, timeLeft, expiresAt } }
}

/** Kiểm tra plan hiện tại (GET /api/payments/check-user-plan) */
export async function checkUserPlan() {
  const { data } = await api.get("/payments/check-user-plan");
  return data; // { success, data: { plan: "free"|"premium", premiumExpiresAt? } } (tuỳ backend)
}

/** Trạng thái thanh toán premium (GET /api/payments/status/premium) */
export async function getPremiumPaymentStatus() {
  const { data } = await api.get("/payments/status/premium");
  return data; // { success, data: { hasActivePayment, paymentExpired, timeLeft, paymentUrl } }
}

/** Lấy payment theo id (GET /api/payments/:paymentId) */
export async function getPaymentById(paymentId) {
  const { data } = await api.get(`/payments/${paymentId}`);
  return data;
}

/** Reset pending premium (POST /api/payments/reset/premium) */
export async function resetPremiumPending() {
  const { data } = await api.post("/payments/reset/premium");
  return data;
}

// (Dev only) test webhook
// export async function testWebhook(orderCode) {
//   const { data } = await api.post("/payments/test-webhook", { orderCode });
//   return data;
// }
/** Xác nhận trực tiếp với PayOS sau khi user quay về app */
export async function confirmPayment(paymentId) {
  if (!paymentId) throw new Error("Missing paymentId");
  const { data } = await api.get(`/payments/confirm/${paymentId}`);
  return data;
}