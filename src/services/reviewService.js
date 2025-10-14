// src/services/reviewService.js
import api from "./api";

/** Submit a product review (1 per user)
 * body: { rating: number (1..5), feedback: string }
 */
export async function submitReview({ rating, feedback }) {
  const { data } = await api.post("/reviews", { rating, feedback });
  return data;
}

/** Get current user's review (or 404 if none) */
export async function getMyReview() {
  try {
    const { data } = await api.get("/reviews/my-review");
    return data; // { success, data: { hasReview, review } }
  } catch (e) {
    const s = e?.response?.status;
    if (s === 404) return { success: true, data: { hasReview: false, review: null } };
    throw e;
  }
}

/** Get approved reviews for public display
 * @param {number} limit default 10
 * @param {number} skip default 0
 */
export async function getPublicReviews({ limit = 10, skip = 0 } = {}) {
  const { data } = await api.get("/reviews/public", { params: { limit, skip } });
  return data; // { success, data: { reviews, totalCount, hasMore } }
}
