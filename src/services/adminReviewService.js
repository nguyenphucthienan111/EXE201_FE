import axios from 'axios'

const api = axios.create({
  baseURL: '/api/reviews',   // => /api/reviews/admin/...
  withCredentials: true,     // nếu BE dùng cookie
})

// Interceptor: gắn token vào header nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// GET /api/reviews/admin?page=1&limit=20&visibility=all&rating=5
export async function getAdminReviews(params = {}) {
  const res = await api.get('/admin', { params })

  // Nếu BE trả về HTML thay vì JSON (do proxy Vite sai)
  const ct = res.headers?.['content-type'] || res.headers?.get?.('content-type')
  if (typeof ct === 'string' && !ct.includes('application/json')) {
    throw new Error('NOT_JSON_RESPONSE')
  }

  return res.data?.data
}

// PATCH /api/reviews/admin/{reviewId}/visibility
export async function toggleReviewVisibility(reviewId, isVisible) {
  const res = await api.patch(`/admin/${reviewId}/visibility`, { isVisible })
  return res.data
}

// GET /api/reviews/admin/stats
export async function getReviewStats() {
  const res = await api.get('/admin/stats')
  return res.data?.data
}
