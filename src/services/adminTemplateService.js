// src/services/adminTemplateService.js
import api from "./api"; // axios instance đã config interceptor

// Lấy tất cả templates (Admin only)
export function getAdminTemplates() {
  return api.get("/templates/admin");
}

// Upload template mới (Admin only)
export function uploadAdminTemplate({ name, description, category, file }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("template", file); // backend yêu cầu field "template"

  return api.post("/templates/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Xoá template hệ thống (chỉ default/premium, admin mới xoá được)
export function deleteAdminTemplate(templateId) {
  return api.delete(`/templates/admin/${templateId}`);
}

// Toggle bật/tắt trạng thái template (active/inactive)
export function toggleAdminTemplateStatus(templateId) {
  return api.patch(`/templates/admin/${templateId}/toggle-status`);
}
