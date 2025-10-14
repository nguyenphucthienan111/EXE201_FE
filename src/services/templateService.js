// src/services/templateService.js
import api from "./api";

/** Build absolute URL từ path tương đối (cho thumbnail/ảnh nếu BE trả relative) */
function toAbsUrl(path) {
  if (!path) return "";
  const p = String(path);
  if (/^https?:\/\//i.test(p)) return p; // đã tuyệt đối
  // baseURL chuẩn dạng https://host/api
  const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");
  const host = base.replace(/\/api$/, "");
  return `${host}/${p.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

/**
 * GET /api/templates
 * Hợp nhất mọi nguồn mà BE có thể trả:
 * - userTemplates (của user)
 * - defaultTemplates (free)
 * - premiumTemplates (premium)
 * - results/list/items (fallback)
 * Trả về { list, userPlan } với list đã chuẩn hoá id/name/imageUrl/isPremium.
 */
export async function getTemplates() {
  const { data } = await api.get("/templates");
  const root = data?.data ?? data ?? {};

  // Các key mà BE thực tế đang trả
  const arrUser = Array.isArray(root.userTemplates)
    ? root.userTemplates
    : Array.isArray(root.templates)
    ? root.templates
    : [];
  const arrDefault = Array.isArray(root.defaultTemplates) ? root.defaultTemplates : [];
  const arrPremium = Array.isArray(root.premiumTemplates) ? root.premiumTemplates : [];

  // Fallback các key khác (phòng trường hợp BE đổi)
  const arrResults = Array.isArray(root.results) ? root.results : [];
  const arrList = Array.isArray(root.list) ? root.list : [];
  const arrItems = Array.isArray(root.items) ? root.items : [];

  // Merge & dedupe theo id
  const rawList = [...arrUser, ...arrDefault, ...arrPremium, ...arrResults, ...arrList, ...arrItems];

  const seen = new Set();
  const normalized = rawList
    .map((t) => {
      const id = t._id || t.id || t.templateId;
      if (!id || seen.has(id)) return null;
      seen.add(id);

      const tags = Array.isArray(t.tags) ? t.tags.map(String) : [];
      const isPremium =
        t.isPremium === true ||
        t.tier === "premium" ||
        t.plan === "premium" ||
        t.category === "premium" ||
        tags.includes("premium");

      return {
        id,
        name: t.name,
        description: t.description,
        category: t.category,
        isPremium,
        imageUrl: toAbsUrl(t.thumbnailUrl || t.imageUrl || t.image || t.preview),
        raw: t,
      };
    })
    .filter(Boolean);

  return {
    list: normalized,
    userPlan: root.userPlan ?? null, // ví dụ: "premium"
    raw: data,
  };
}

/**
 * POST /api/templates/upload
 * multipart/form-data: name, description, template (binary)
 */
export async function uploadTemplate({ name, description, file }) {
  const formData = new FormData();
  if (name) formData.append("name", name);
  if (description) formData.append("description", description);
  formData.append("template", file);

  const { data } = await api.post("/templates/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * POST /api/templates/{templateId}/use
 * body: { journalId }
 */
export async function useTemplate(templateId, journalId) {
  const { data } = await api.post(`/templates/${templateId}/use`, { journalId });
  return data;
}

/**
 * DELETE /api/templates/{templateId}
 */
export async function deleteTemplate(templateId) {
  const { data } = await api.delete(`/templates/${templateId}`);
  return data;
}
