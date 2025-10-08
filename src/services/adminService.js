import api from "./api";

// Dashboard tổng quan
export const fetchAdminDashboard = () => api.get("/admin/dashboard"); // 200: {success, data: { stats, recentSubscribers, expiringSubscriptions, revenueStats }}

// Users (pagination + filter)
export const fetchAdminUsers = ({ page = 1, limit = 20, plan, search } = {}) => {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (plan) params.set("plan", plan);       // free | premium
  if (search) params.set("search", search); // text
  return api.get(`/admin/users?${params.toString()}`);
};

// Toggle role (user <-> admin) — chỉ test
export const toggleUserRole = (userId) =>
  api.patch(`/admin/users/${userId}/toggle-role`);

// Toggle premium (chỉ test) — body: { durationDays: 30 }
export const toggleUserPremium = (userId, durationDays = 30) =>
  api.patch(`/admin/users/${userId}/toggle-premium`, { durationDays });

// Payments (pagination + status filter)
export const fetchAdminPayments = ({ page = 1, limit = 20, status } = {}) => {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (status) params.set("status", status); // pending | success | failed | cancelled
  return api.get(`/admin/payments?${params.toString()}`);
};

// Revenue analytics (period: daily | weekly | monthly | yearly)
export const fetchRevenueAnalytics = (period = "monthly") =>
  api.get(`/admin/revenue?period=${period}`);

// System health
export const fetchSystemHealth = () =>
  api.get("/admin/system/health");
