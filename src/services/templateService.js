// src/services/templateService.js
import api from "./api";

// build absolute URL từ path tương đối của server
function toAbsUrl(path) {
  if (!path) return "";
  const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api")
    .replace(/\/+$/,"");               // bỏ dấu / cuối
  const host = base.replace(/\/api$/,""); // lấy origin http://localhost:3000
  return `${host}/${String(path).replace(/\\/g,"/").replace(/^\/+/,"")}`;
}

/** Lấy tất cả template có sẵn (Free & Premium) -> trả về mảng đã chuẩn hoá */
export async function getTemplates() {
  const { data } = await api.get("/templates");
  const arr = data?.data?.defaultTemplates;
  const list = Array.isArray(arr) ? arr : [];
  // chuẩn hoá fields cho FE dùng thống nhất
  return list.map((t) => ({
    id: t._id || t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    imageUrl: toAbsUrl(t.thumbnailUrl || t.imageUrl || t.image || t.preview),
    raw: t,
  }));
}

export async function uploadTemplate({ name, description, file }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("template", file);
  const { data } = await api.post("/templates/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function useTemplate(templateId, journalId) {
  const { data } = await api.post(`/templates/${templateId}/use`, { journalId });
  return data;
}

export async function deleteTemplate(templateId) {
  const { data } = await api.delete(`/templates/${templateId}`);
  return data;
}
