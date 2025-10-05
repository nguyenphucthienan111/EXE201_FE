// src/services/notificationService.js
import api from "./api";

/** Unread count badge (GET /api/notifications/unread-count) */
export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data; // { success, data: { unreadCount } }
}

/** List notifications (GET /api/notifications) */
export async function getNotifications({ page = 1, limit = 20, unread = false } = {}) {
  const { data } = await api.get("/notifications", { params: { page, limit, unread } });
  return data; // { success, data: { notifications, unreadCount, pagination } }
}

/** Mark one as read (PUT /api/notifications/:id/read) */
export async function markNotificationRead(notificationId) {
  const { data } = await api.put(`/notifications/${notificationId}/read`);
  return data;
}

/** Mark all read (PUT /api/notifications/mark-all-read) */
export async function markAllNotificationsRead() {
  const { data } = await api.put("/notifications/mark-all-read");
  return data;
}

/** Delete one (DELETE /api/notifications/:id) */
export async function deleteNotification(notificationId) {
  const { data } = await api.delete(`/notifications/${notificationId}`);
  return data;
}

// (Dev only) manual trigger check – optional:
// export async function triggerCheck() {
//   const { data } = await api.post("/notifications/trigger-check");
//   return data;
// }
