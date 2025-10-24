// src/components/Journal/AnalyzeResultModal.jsx
import { useEffect, useMemo, useState } from "react";
import "../style/Journal.css";
import { getAnalysisHistory } from "../../services/journalService";

/* ---------- Utils ---------- */

// Chuẩn hoá nhiều dạng response về mảng
function normalizeHistory(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.list)) return resp.list;
  const d = resp?.data ?? resp ?? {};
  const list = d.list || d.items || d.analyses || d.results || d.history || [];
  return Array.isArray(list) ? list : [];
}

// Map một item lịch sử -> các field dùng hiển thị + giữ full results/raw
function pickHistoryFields(item = {}) {
  const r = item.results || {};
  const emo = r.emotionAnalysis || item.emotionAnalysis || {};
  const sent = r.sentimentAnalysis || item.sentimentAnalysis || {};
  const createdAt = item.createdAt || item.savedAt;
  const context = (item.context || r.context || "").trim();

  return {
    id: item.id || item._id || createdAt || Math.random().toString(36).slice(2),
    createdAt,
    primaryEmotion: emo.primaryEmotion ?? null,
    emotionScore: typeof emo.emotionScore === "number" ? emo.emotionScore : null,
    sentiment: sent.overallSentiment ?? null,
    sentimentScore: typeof sent.sentimentScore === "number" ? sent.sentimentScore : null,
    context,
    results: r,   // giữ để xem chi tiết
    raw: item,
  };
}

const sentimentTone = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "negative") return "red";
  if (v === "positive") return "green";
  if (v === "neutral")  return "gray";
  return "indigo";
};

const levelTone = (val) => {
  if (!val) return "gray";
  const v = String(val).toLowerCase();
  if (v === "high") return "red";
  if (v === "medium" || v === "moderate") return "amber";
  if (v === "low") return "green";
  return "indigo";
};

/* ---------- Component ---------- */

// eslint-disable-next-line react/prop-types
export default function AnalyzeResultModal({ open, data, onClose, journalId }) {
  if (!open) return null;

  // Tabs: current | history
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tab, setTab] = useState("current");
  // History state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [history, setHistory] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loadingHistory, setLoadingHistory] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [errHistory, setErrHistory] = useState("");

  // History view: list | detail
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [historyView, setHistoryView] = useState("list");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedItem, setSelectedItem] = useState(null);

  // Data hiện tại (analyze vừa trả)
  // eslint-disable-next-line react/prop-types
  const emo = data?.emotionAnalysis || {};
  // eslint-disable-next-line react/prop-types
  const sent = data?.sentimentAnalysis || {};
  // eslint-disable-next-line react/prop-types
  const mh   = data?.mentalHealthIndicators || {};
  // eslint-disable-next-line react/prop-types
  const sug  = data?.improvementSuggestions || {};
  // eslint-disable-next-line react/prop-types
  const k    = data?.keywords || {};

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const canLoadHistory = useMemo(() => Boolean(journalId), [journalId]);

  // Mỗi lần mở modal -> reset
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (open) {
      setTab("current");
      setHistoryView("list");
      setSelectedItem(null);
    }
  }, [open]);

  async function loadHistory() {
    if (!canLoadHistory) return;
    setLoadingHistory(true);
    setErrHistory("");
    try {
      const resp = await getAnalysisHistory(journalId, { page: 1, limit: 20, type: "emotion" });
      const mapped = normalizeHistory(resp).map(pickHistoryFields);
      setHistory(mapped);
    } catch (e) {
      setErrHistory(e?.response?.data?.message || e?.message || "Load history failed");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Vào tab History thì nạp
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (open && tab === "history" && canLoadHistory) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, canLoadHistory]);

  // UI atoms
  // eslint-disable-next-line react/prop-types
  const Chip = ({ text, tone = "gray" }) => (
    <span className={`ai-chip ai-chip--${tone}`}>{text}</span>
  );
  // eslint-disable-next-line react/prop-types
  const List = ({ items }) => {
    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) return <div className="ai-empty">—</div>;
    return <ul className="ai-list">{arr.map((x, i) => <li key={i}>{x}</li>)}</ul>;
  };

  // Khối render chi tiết (dùng cho Current & History Detail)
  // eslint-disable-next-line react/prop-types
  function AnalysisDetail({ payload }) {
    // eslint-disable-next-line react/prop-types
    const emoX = payload?.emotionAnalysis || {};
    // eslint-disable-next-line react/prop-types
    const sentX = payload?.sentimentAnalysis || {};
    // eslint-disable-next-line react/prop-types
    const mhX   = payload?.mentalHealthIndicators || {};
    // eslint-disable-next-line react/prop-types
    const sugX  = payload?.improvementSuggestions || {};
    // eslint-disable-next-line react/prop-types
    const kX    = payload?.keywords || {};
    // eslint-disable-next-line no-unused-vars
    const tfX   = sugX?.timeframes || {};

    return (
      <>
        {/* Summary cards */}
        <div className="ai-grid">
          <div className="ai-card ai-card--gradient1">
            <div className="ai-card-label">Primary Emotion</div>
            <div className="ai-card-value">{emoX.primaryEmotion ?? "—"}</div>
            <div className="ai-card-sub">
              Score: {emoX.emotionScore ?? "—"} · Conf: {emoX.confidence ?? "—"}
            </div>
          </div>
          <div className="ai-card ai-card--gradient2">
            <div className="ai-card-label">Sentiment</div>
            <div className="ai-card-value">{sentX.overallSentiment ?? "—"}</div>
            <div className="ai-card-sub">
              Score: {typeof sentX.sentimentScore === "number" ? sentX.sentimentScore : "—"}
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="ai-section">
          <div className="ai-section-title">Mental Health Indicators</div>
          <div className="ai-indicators">
            <div className="ai-ind-item">
              <span className="ai-ind-label">Stress</span>
              <Chip text={mhX.stressLevel ?? "—"} tone={levelTone(mhX.stressLevel)} />
            </div>
            <div className="ai-ind-item">
              <span className="ai-ind-label">Anxiety</span>
              <Chip text={mhX.anxietyLevel ?? "—"} tone={levelTone(mhX.anxietyLevel)} />
            </div>
            <div className="ai-ind-item">
              <span className="ai-ind-label">Depression</span>
              <Chip
                text={typeof mhX.depressionSigns === "boolean" ? (mhX.depressionSigns ? "Yes" : "No") : "—"}
                tone={typeof mhX.depressionSigns === "boolean" ? (mhX.depressionSigns ? "red" : "green") : "gray"}
              />
            </div>
            <div className="ai-ind-item">
              <span className="ai-ind-label">Risk</span>
              <Chip text={mhX.riskLevel ?? "—"} tone={levelTone(mhX.riskLevel)} />
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="ai-section">
          <div className="ai-section-title">Keywords</div>
          <div className="ai-kw-block">
            <div className="ai-kw-group">
              <div className="ai-kw-title">Emotional</div>
              <div className="ai-kw-chips">
                {(kX.emotional || []).map((w, i) => <Chip key={`e-${i}`} text={w} tone="indigo" />)}
                {(!kX.emotional || !kX.emotional.length) && <span className="ai-empty">—</span>}
              </div>
            </div>
            <div className="ai-kw-group">
              <div className="ai-kw-title">Behavioral</div>
              <div className="ai-kw-chips">
                {(kX.behavioral || []).map((w, i) => <Chip key={`b-${i}`} text={w} tone="pink" />)}
                {(!kX.behavioral || !kX.behavioral.length) && <span className="ai-empty">—</span>}
              </div>
            </div>
            <div className="ai-kw-group">
              <div className="ai-kw-title">Physical</div>
              <div className="ai-kw-chips">
                {(kX.physical || []).map((w, i) => <Chip key={`p-${i}`} text={w} tone="green" />)}
                {(!kX.physical || !kX.physical.length) && <span className="ai-empty">—</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="ai-section">
          <div className="ai-section-title">Improvement Suggestions</div>
          <div className="ai-sugg">
            <div className="ai-sugg-title">Immediate</div>
            <List items={sugX.immediateActions} />
          </div>
          <div className="ai-sugg">
            <div className="ai-sugg-title">Short-term</div>
            <List items={sugX.shortTermGoals} />
          </div>
          <div className="ai-sugg">
            <div className="ai-sugg-title">Long-term</div>
            <List items={sugX.longTermStrategies} />
          </div>
          <div className="ai-timeframes">
            <div>⏱ Immediate: <b>{(sugX.timeframes || {}).immediate ?? "—"}</b></div>
            <div>📅 Short-term: <b>{(sugX.timeframes || {}).shortTerm ?? "—"}</b></div>
            <div>🗓 Long-term: <b>{(sugX.timeframes || {}).longTerm ?? "—"}</b></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal ai-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-badge">AI</span>
            Emotion Analysis
          </div>
          <button className="ai-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className="ai-tabs">
          <button
            className={`ai-tab ${tab === "current" ? "active" : ""}`}
            onClick={() => setTab("current")}
            type="button"
          >
            Current
          </button>
          <button
            className={`ai-tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
            type="button"
          >
            History
          </button>
        </div>

        {/* Scrollable content */}
        <div className="ai-content">
          {tab === "current" && (
            <AnalysisDetail
              payload={{
                emotionAnalysis: emo,
                sentimentAnalysis: sent,
                mentalHealthIndicators: mh,
                improvementSuggestions: sug,
                keywords: k,
              }}
            />
          )}

          {tab === "history" && (
            <div className="ai-section">
              {/* Title + actions */}
              <div className="ai-section-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{historyView === "list" ? "Analysis History" : "Analysis Detail"}</span>
                <div style={{display:"flex",gap:8}}>
                  {historyView === "detail" && (
                    <button
                      className="ai-mini-btn"
                      type="button"
                      onClick={() => { setHistoryView("list"); setSelectedItem(null); }}
                    >
                      ← Back
                    </button>
                  )}
                  {canLoadHistory && (
                    <button className="ai-mini-btn" onClick={loadHistory} disabled={loadingHistory}>
                      {loadingHistory ? "Loading..." : "Refresh"}
                    </button>
                  )}
                </div>
              </div>

              {/* Error / Missing */}
              {!canLoadHistory && (
                <div className="ai-empty">Missing <code>journalId</code> – cannot load history.</div>
              )}
              {errHistory && <div className="ed-alert" style={{marginTop:8}}>{errHistory}</div>}

              {/* List view */}
              {!errHistory && canLoadHistory && historyView === "list" && (
                <>
                  {loadingHistory ? (
                    <div className="ai-empty">Loading history...</div>
                  ) : history.length ? (
                    <ul className="ai-history-list">
                      {history.map((h) => {
                        const dateStr = h.createdAt ? new Date(h.createdAt).toLocaleString() : "—";
                        const preview = (h.context || "").replace(/\s+/g, " ").slice(0, 140);
                        const showDots = (h.context || "").length > 140;
                        return (
                          <li
                            key={h.id}
                            className="ai-history-row ai-history-clickable"
                            onClick={() => { setSelectedItem(h); setHistoryView("detail"); }}
                            title="Click to view details"
                          >
                            <div className="ai-history-left">
                              <div className="ai-history-topline">
                                <span className="ai-history-emotion">{h.primaryEmotion ?? "—"}</span>
                                <span className={`ai-chip ai-chip--${sentimentTone(h.sentiment)}`}>
                                  {h.sentiment ?? "—"}
                                </span>
                              </div>
                              {preview && (
                                <div className="ai-history-preview">
                                  {preview}{showDots ? "…" : ""}
                                </div>
                              )}
                            </div>
                            <time className="ai-history-date" dateTime={h.createdAt || ""}>
                              {dateStr}
                            </time>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="ai-empty">No history found.</div>
                  )}
                </>
              )}

              {/* Detail view */}
              {!errHistory && canLoadHistory && historyView === "detail" && selectedItem && (
                <AnalysisDetail
                  payload={{
                    emotionAnalysis: selectedItem.results?.emotionAnalysis,
                    sentimentAnalysis: selectedItem.results?.sentimentAnalysis,
                    mentalHealthIndicators: selectedItem.results?.mentalHealthIndicators,
                    improvementSuggestions: selectedItem.results?.improvementSuggestions,
                    keywords: selectedItem.results?.keywords,
                  }}
                />
              )}
            </div>
          )}

          {/* Footer */}
          <div className="ai-footer">
            <button className="modal-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
