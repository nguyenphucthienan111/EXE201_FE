// src/services/api.js
import axios from "axios";
import { refreshToken } from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // nếu backend dùng cookie
});

// ---------------- Helpers ----------------
const isPublicAuthEndpoint = (url = "") => {
  const u = String(url).toLowerCase();
  return (
    u.includes("/auth/login") ||
    u.includes("/auth/register") ||
    u.includes("/auth/verify") ||
    u.includes("/auth/forgot") ||
    u.includes("/auth/reset") ||
    u.includes("/auth/google") ||
    u.includes("/auth/otp")
  );
};

// ---------------- Request interceptor ----------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Nếu gửi FormData: để axios tự set boundary
    if (config.data instanceof FormData) {
      if (config.headers) delete config.headers["Content-Type"];
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------- Response interceptor (refresh) ----------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const url = originalRequest?.url || "";

    // 1) Nếu là endpoint auth công khai (login/register/verify/forgot...), KHÔNG refresh/redirect
    if (status === 401 && isPublicAuthEndpoint(url)) {
      // trả lỗi cho UI (toast), không tải lại trang
      return Promise.reject(error);
    }

    // 2) Chỉ xử lý refresh cho các request bảo vệ
    if (status === 401 && !originalRequest._retry) {
      const hasRefresh = !!localStorage.getItem("refresh_token");
      if (!hasRefresh) {
        // Không có refresh token: không redirect ở đây, để UI tự xử lý
        localStorage.removeItem("access_token");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Xếp hàng đợi khi đang refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // QUAN TRỌNG: refreshToken() không dùng instance 'api' để tránh vòng lặp
        const data = await refreshToken();
        const newToken = data?.accessToken;

        processQueue(null, newToken);

        if (newToken) {
          localStorage.setItem("access_token", newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = "Bearer " + newToken;
        }

        return api(originalRequest);
      } catch (err) {
        // Refresh thất bại: dọn token và chỉ điều hướng nếu không ở /login
        processQueue(err, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          // tránh reload khi đang ở login (gây flicker)
          window.location.assign("/login");
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 3) Các lỗi khác
    return Promise.reject(error);
  }
);

export default api;
