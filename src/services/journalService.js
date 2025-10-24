// src/services/journalService.js
import api from "./api";

/* =========================
   Helpers
   ========================= */

/** Chuẩn hoá kết quả gợi ý về { suggestions: [] } */
function normalizeSuggestions(resp) {
  const d = resp?.data?.data || resp?.data || {};
  const suggestions = Array.isArray(d?.suggestions) ? d.suggestions : [];
  return { suggestions, _raw: resp?.data };
}

/* =========================
   CRUD Journals
   ========================= */

export async function createJournal({
  title,
  content,
  mood,
  tags = [],
  richContent,
  templateId,
}) {
  const { data } = await api.post("/journals", {
    title,
    content,
    mood,
    tags,
    richContent,
    templateId,
  });
  return data;
}

export async function getJournals({ page = 1, limit = 10 } = {}) {
  const { data } = await api.get("/journals", { params: { page, limit } });
  return data;
}

/** Get one journal (fallback qua list nếu BE không có GET /journals/:id) */
export async function getJournal(id) {
  try {
    const { data } = await api.get(`/journals/${id}`);
    return data;
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // eslint-disable-next-line no-useless-catch
    try {
      const { data: list } = await api.get("/journals", {
        params: { page: 1, limit: 200 },
      });
      const arr = Array.isArray(list) ? list : [];
      const found = arr.find((x) => (x?._id || x?.id) === id);
      if (!found) {
        const err = new Error("Journal not found");
        err.response = { status: 404 };
        throw err;
      }
      return found;
    } catch (e2) {
      throw e2;
    }
  }
}

export async function updateJournal(id, payload) {
  const { data } = await api.put(`/journals/${id}`, payload);
  return data;
}

export async function deleteJournal(id) {
  const { data } = await api.delete(`/journals/${id}`);
  return data;
}

/* =========================
   AI features
   ========================= */

/** AI Emotion Analysis (Premium) */
export async function analyze({ content, journalId }) {
  const resp = await api.post("/journals/emotion-analysis", {
    content,
    journalId,
  });
  // swagger trả { success, data: { ... } } -> lấy thẳng object trong data
  return resp?.data?.data;
}

/**
 * History: Lấy lịch sử phân tích AI
 * Swagger: GET /journals/ai-analysis/history
 * Params hỗ trợ: type, page, limit, (optional) journalId
 * Trả về { list, _raw } trong đó list đã map sẵn các field thường dùng.
 */
export async function getAnalysisHistory(
  journalId,
  { page = 1, limit = 20, type = "emotion" } = {}
) {
  const params = { page, limit, type };
  if (journalId) params.journalId = journalId;

  const { data } = await api.get("/journals/ai-analysis/history", { params });

  const root = data?.data ?? data ?? {};
  const rawAnalyses = Array.isArray(root.analyses) ? root.analyses : [];

  const list = rawAnalyses.map((item) => {
    const r = item?.results || {};
    const emo = r.emotionAnalysis || item?.emotionAnalysis || {};
    const sent = r.sentimentAnalysis || item?.sentimentAnalysis || {};
    // Một số BE có thêm context để xem nhanh đoạn văn bản đã phân tích
    const context = item?.context || r?.context || "";

    return {
      id: item?.id || item?._id,
      createdAt: item?.createdAt || item?.savedAt,
      type: item?.type || "emotion",
      context,
      // các field để UI dùng trực tiếp
      primaryEmotion: emo.primaryEmotion ?? null,
      emotionScore: typeof emo.emotionScore === "number" ? emo.emotionScore : null,
      sentiment: sent.overallSentiment ?? null,
      sentimentScore: typeof sent.sentimentScore === "number" ? sent.sentimentScore : null,
      results: r,   // giữ toàn bộ block để xem chi tiết nếu cần
      raw: item,
    };
  });

  return { list, _raw: data };
}

/**
 * History: Lưu một kết quả phân tích mới (tùy BE)
 * Nhiều backend TỰ LƯU khi gọi /emotion-analysis, nên hàm này best-effort:
 * - Nếu có endpoint POST /journals/:id/analysis-history -> dùng.
 * - Nếu 404/405/501 -> coi như skipped, không làm vỡ UI.
 */
export async function saveAnalysisHistory(journalId, analysisData) {
  try {
    const { data } = await api.post(
      `/journals/${journalId}/analysis-history`,
      analysisData
    );
    return { ok: true, data };
  } catch (e) {
    const status = e?.response?.status;
    if (status === 404 || status === 405 || status === 501) {
      return { ok: true, skipped: true };
    }
    // lỗi khác thì throw để bạn log nếu cần
    throw e;
  }
}

/** AI suggestion (basic) – Free: 3/day, Premium: unlimited */
export async function suggestBasic({ mood, topic, journalId }) {
  const resp = await api.post("/journals/suggest-basic", {
    mood,
    topic,
    journalId,
  });
  return normalizeSuggestions(resp);
}

/** AI suggestion (advanced) – Premium */
export async function suggestAdvanced({ topic, mood, journalId }) {
  const resp = await api.post("/journals/suggest", { topic, mood, journalId });
  return normalizeSuggestions(resp);
}

/** (Optional) Assistant – hiện BE không có -> ném lỗi để tránh gọi nhầm */
export async function assistant() {
  const err = new Error("Assistant API is not supported by the current backend.");
  err.response = { status: 501 };
  throw err;
}

/* =========================
   Misc / Premium
   ========================= */

export async function markSynced(id) {
  const { data } = await api.post(`/journals/sync/${id}`);
  return data;
}

export async function getDashboard({ period = "month" } = {}) {
  const { data } = await api.get("/journals/dashboard", {
    params: { period },
  });
  return data;
}

export async function improvementPlan({
  focusAreas = ["anxiety"],
  duration = 7,
}) {
  const { data } = await api.post("/journals/improvement-plan", {
    focusAreas,
    duration,
  });
  return data;
}

export async function getUsage() {
  const { data } = await api.get("/journals/usage");
  return data;
}

export async function printJournal(
  id,
  {
    paperSize = "A4",
    printQuality = "Standard",
    colorOptions = "Color",
    copies = 1,
  } = {}
) {
  const { data } = await api.post(`/journals/${id}/print`, {
    paperSize,
    printQuality,
    colorOptions,
    copies,
  });
  return data;
}

export async function downloadJournalPdf(id) {
  const { data } = await api.get(`/journals/${id}/print/download`, {
    responseType: "blob",
  });
  return data; // blob
}
