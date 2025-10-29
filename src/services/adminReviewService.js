import apiBase from "./api";

// Dùng axios instance chung đã cấu hình baseURL = VITE_API_URL
// Ghép thêm prefix `/reviews` để gọi đúng BE trên production
const api = {
  get: (url, opts) => apiBase.get(`/reviews${url}`, opts),
  patch: (url, data, opts) => apiBase.patch(`/reviews${url}`, data, opts),
};

// GET /api/reviews/admin?page=1&limit=20&visibility=all&rating=5
export async function getAdminReviews(params = {}) {
  const res = await api.get("/admin", { params });

  // Nếu BE trả về HTML thay vì JSON (do proxy Vite sai)
  const ct =
    res.headers?.["content-type"] || res.headers?.get?.("content-type");
  if (typeof ct === "string" && !ct.includes("application/json")) {
    throw new Error("NOT_JSON_RESPONSE");
  }

  return res.data?.data;
}

// PATCH /api/reviews/admin/{reviewId}/visibility
export async function toggleReviewVisibility(reviewId, isVisible) {
  const res = await api.patch(`/admin/${reviewId}/visibility`, { isVisible });
  return res.data;
}

// GET /api/reviews/admin/stats
export async function getReviewStats() {
  const res = await api.get("/admin/stats");
  return res.data?.data;
}
