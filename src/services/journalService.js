// src/services/journalService.js
import api from "./api";

/** Create a journal (Free: max 2/day, Premium: unlimited) */
export async function createJournal({ title, content, mood, tags = [] }) {
  const { data } = await api.post("/journals", { title, content, mood, tags });
  return data;
}

/** List journals with pagination */
export async function getJournals({ page = 1, limit = 10 } = {}) {
  const { data } = await api.get("/journals", { params: { page, limit } });
  return data;
}

/** Get one journal (optional helper) */
export async function getJournal(id) {
  const { data } = await api.get(`/journals/${id}`);
  return data;
}

/** Update a journal */
export async function updateJournal(id, payload) {
  // payload: { title?, content?, mood?, tags? }
  const { data } = await api.put(`/journals/${id}`, payload);
  return data;
}

/** Delete a journal */
export async function deleteJournal(id) {
  const { data } = await api.delete(`/journals/${id}`);
  return data;
}

/** AI suggestion (basic) – Free: 3/day, Premium: unlimited */
export async function suggestBasic({ mood, topic, journalId }) {
  const { data } = await api.post("/journals/suggest-basic", { mood, topic, journalId });
  return data; // { success, data: { suggestions: [...] } }
}

/** AI suggestion (advanced) – Premium */
export async function suggestAdvanced({ topic, mood, journalId }) {
  const { data } = await api.post("/journals/suggest", { topic, mood, journalId });
  return data;
}

/** AI Assistant – Premium */
export async function assistant({ question, context = {} }) {
  const { data } = await api.post("/journals/assistant", { question, context });
  return data;
}

/** AI Analysis – Premium */
export async function analyze({ content, journalId }) {
  const { data } = await api.post("/journals/analyze", { content, journalId });
  return data;
}

/** Mark synced (premium) */
export async function markSynced(id) {
  const { data } = await api.post(`/journals/sync/${id}`);
  return data;
}

/** Dashboard (premium) */
export async function getDashboard({ period = "month" } = {}) {
  const { data } = await api.get("/journals/dashboard", { params: { period } });
  return data;
}

/** Personalized improvement plan (premium) */
export async function improvementPlan({ focusAreas = ["anxiety"], duration = 7 }) {
  const { data } = await api.post("/journals/improvement-plan", { focusAreas, duration });
  return data;
}

/** Usage (free & premium) */
export async function getUsage() {
  const { data } = await api.get("/journals/usage");
  return data;
}
