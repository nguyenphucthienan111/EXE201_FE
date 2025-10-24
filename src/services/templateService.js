// src/services/templateService.js
import api from "./api";

/** Lấy origin từ baseURL của api (ổn định hơn ENV lẻ) */
function getApiOrigin() {
  try {
    const base = api?.defaults?.baseURL || import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const u = new URL(base);
    return u.origin; // vd: https://host
  } catch {
    return "http://localhost:3000";
  }
}

/** Build absolute URL từ path tương đối (cho thumbnail/ảnh nếu BE trả relative) */
export function toAbsUrl(path) {
  if (!path) return "";
  const p = String(path);

  // data:, blob:, http(s) tuyệt đối
  if (/^(data:|blob:)/i.test(p)) return p;
  if (/^https?:\/\//i.test(p)) return p;

  // Nếu BE trả "/uploads/xxx" → ghép vào origin của API
  const origin = getApiOrigin(); // vd https://host
  const cleaned = p.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${origin}/${cleaned}`;
}

/** ---- Internal: normalize 1 template item về schema FE ---- */
function normalizeTemplateItem(t) {
  if (!t) return null;

  const id = t._id || t.id || t.templateId;
  if (!id) return null;

  const tags = Array.isArray(t.tags) ? t.tags.map(String) : [];
  const category = (t.category || "").toString().trim().toLowerCase();
  const isPremium =
    t.isPremium === true ||
    ["premium", "pro"].includes(t.tier) ||
    ["premium", "pro"].includes(t.plan) ||
    category === "premium" ||
    tags.includes("premium") ||
    tags.includes("pro");

  const img =
    t.thumbnailUrl ||
    t.imageUrl ||
    t.image ||
    t.preview ||
    t.cover ||
    t.templateUrl ||
    t.thumbnail;

  return {
    id: String(id),
    name: t.name || t.title || "Untitled",
    description: t.description || t.desc || "",
    category: category || "default",
    isPremium,
    imageUrl: toAbsUrl(img),
    starterText: t.starterText || t.defaultContent || "",
    raw: t, // giữ nguyên bản gốc để tra cứu khi cần
  };
}

/** ---- Internal: hợp nhất nhiều mảng + dedupe theo id ---- */
function mergeAndNormalizeArrays(...arrs) {
  const merged = arrs.flat().filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const item of merged) {
    const norm = normalizeTemplateItem(item);
    if (!norm) continue;
    if (seen.has(norm.id)) continue;
    seen.add(norm.id);
    out.push(norm);
  }
  return out;
}

/** Cache nhẹ trong phiên để getTemplateById dùng lại */
let __templatesCache = null;

/**
 * GET /templates
 * Gom & chuẩn hoá các keys có thể BE trả:
 *   userTemplates, defaultTemplates, premiumTemplates, templates,
 *   results, list, items, data.templates ...
 * Trả về: { list, userPlan, raw }
 */
export async function getTemplates() {
  try {
    const { data } = await api.get("/templates");
    const root = data?.data ?? data ?? {};

    const arrUser = Array.isArray(root.userTemplates) ? root.userTemplates : [];
    // Một số BE để chung vào "templates"
    const arrTemplates = Array.isArray(root.templates) ? root.templates : [];
    const arrDefault = Array.isArray(root.defaultTemplates) ? root.defaultTemplates : [];
    const arrPremium = Array.isArray(root.premiumTemplates) ? root.premiumTemplates : [];

    // Fallback các key khác
    const arrResults = Array.isArray(root.results) ? root.results : [];
    const arrList = Array.isArray(root.list) ? root.list : [];
    const arrItems = Array.isArray(root.items) ? root.items : [];

    const list = mergeAndNormalizeArrays(
      arrUser,
      arrTemplates,
      arrDefault,
      arrPremium,
      arrResults,
      arrList,
      arrItems
    );

    __templatesCache = list; // cache ngắn hạn

    return {
      list,
      userPlan: root.userPlan ?? root.plan ?? null,
      raw: data,
    };
  } catch (e) {
    // Không làm vỡ UI: trả list rỗng nhưng vẫn có cấu trúc
    __templatesCache = [];
    return { list: [], userPlan: null, raw: null, error: e };
  }
}

/**
 * Tiện ích: tìm template theo id (ưu tiên dùng cache từ getTemplates())
 * Nếu chưa có cache, sẽ gọi getTemplates().
 */
export async function getTemplateById(templateId) {
  if (!templateId) return null;
  if (!__templatesCache) {
    const res = await getTemplates();
    __templatesCache = res.list || [];
  }
  return __templatesCache.find((t) => t.id === String(templateId)) || null;
}

/** Alias ngắn gọn */
export const findTemplate = getTemplateById;

/**
 * POST /templates/upload
 * multipart/form-data: name, description, template (binary)
 */
export async function uploadTemplate({ name, description, file }) {
  const formData = new FormData();
  if (name) formData.append("name", name);
  if (description) formData.append("description", description);
  formData.append("template", file);

  // eslint-disable-next-line no-useless-catch
  try {
    const { data } = await api.post("/templates/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Upload xong làm tươi cache
    __templatesCache = null;
    return data;
  } catch (e) {
    throw e;
  }
}

/**
 * POST /templates/{templateId}/use
 * body: { journalId }
 */
export async function useTemplate(templateId, journalId) {
  const { data } = await api.post(`/templates/${templateId}/use`, { journalId });
  return data;
}

/**
 * DELETE /templates/{templateId}
 */
export async function deleteTemplate(templateId) {
  const { data } = await api.delete(`/templates/${templateId}`);
  // Xoá xong làm tươi cache
  __templatesCache = null;
  return data;
}
