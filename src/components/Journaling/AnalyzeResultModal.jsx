// src/components/Journal/AnalyzeResultModal.jsx
import { useEffect, useMemo, useState } from "react";
import "../style/Journal.css";
import { getAnalysisHistory } from "../../services/journalService";

/* ---------- Utils ---------- */

// Normalize nhiều dạng response khác nhau về mảng items
function normalizeHistory(resp) {
  // service.getAnalysisHistory hiện đã trả { list, _raw }
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.list)) return resp.list;

  const d = resp?.data ?? resp ?? {};
  const list =
    d.list ||
    d.items ||
    d.analyses ||
    d.results ||
    d.history ||
    [];
  return Array.isArray(list) ? list : [];
}

// rút trích thông tin hiển thị từ 1 item lịch sử (chống trượt key)
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
    emotionScore:
      typeof emo.emotionScore === "number" ? emo.emotionScore : null,
    sentiment: sent.overallSentiment ?? null,
    sentimentScore:
      typeof sent.sentimentScore === "number" ? sent.sentimentScore : null,
    context,
  };
}

const sentimentTone = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "negative") return "red";
  if (v === "positive") return "green";
  if (v === "neutral") return "gray";
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tab] = useState("current"); // current | history
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [history, setHistory] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loadingHistory, setLoadingHistory] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [errHistory, setErrHistory] = useState("");

  // data từ service.analyze(): object swagger /data
  // eslint-disable-next-line react/prop-types
  const emo = data?.emotionAnalysis || {};
  // eslint-disable-next-line react/prop-types
  const sent = data?.sentimentAnalysis || {};
  // eslint-disable-next-line react/prop-types
  const mh = data?.mentalHealthIndicators || {};
  // eslint-disable-next-line react/prop-types
  const sug = data?.improvementSuggestions || {};
  // eslint-disable-next-line react/prop-types
  const k = data?.keywords || {};
  const tf = sug?.timeframes || {};

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const canLoadHistory = useMemo(() => Boolean(journalId), [journalId]);

  async function loadHistory() {
    if (!canLoadHistory) return;
    setLoadingHistory(true);
    setErrHistory("");
    try {
      // lấy đúng API lịch sử (service đã map)
      const resp = await getAnalysisHistory(journalId, {
        page: 1,
        limit: 20,
        type: "emotion",
      });

      const raw = normalizeHistory(resp);
      const mapped = raw.map(pickHistoryFields);
      setHistory(mapped);
    } catch (e) {
      console.error(e);
      setErrHistory(
        e?.response?.data?.message || e?.message || "Load history failed"
      );
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // mở tab History tự nạp
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (open && tab === "history" && canLoadHistory) {
      loadHistory();
    }
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
    return (
      <ul className="ai-list">
        {arr.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    );
  };

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
          <button className="ai-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
       

        {/* Scrollable content */}
        <div className="ai-content">
          {tab === "current" && (
            <>
              {/* Summary cards */}
              <div className="ai-grid">
                <div className="ai-card ai-card--gradient1">
                  <div className="ai-card-label">Primary Emotion</div>
                  <div className="ai-card-value">
                    {emo.primaryEmotion ?? "—"}
                  </div>
                  <div className="ai-card-sub">
                    Score: {emo.emotionScore ?? "—"} · Conf:{" "}
                    {emo.confidence ?? "—"}
                  </div>
                </div>

                <div className="ai-card ai-card--gradient2">
                  <div className="ai-card-label">Sentiment</div>
                  <div className="ai-card-value">
                    {sent.overallSentiment ?? "—"}
                  </div>
                  <div className="ai-card-sub">
                    Score:{" "}
                    {typeof sent.sentimentScore === "number"
                      ? sent.sentimentScore
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Indicators */}
              <div className="ai-section">
                <div className="ai-section-title">Mental Health Indicators</div>
                <div className="ai-indicators">
                  <div className="ai-ind-item">
                    <span className="ai-ind-label">Stress</span>
                    <Chip
                      text={mh.stressLevel ?? "—"}
                      tone={levelTone(mh.stressLevel)}
                    />
                  </div>
                  <div className="ai-ind-item">
                    <span className="ai-ind-label">Anxiety</span>
                    <Chip
                      text={mh.anxietyLevel ?? "—"}
                      tone={levelTone(mh.anxietyLevel)}
                    />
                  </div>
                  <div className="ai-ind-item">
                    <span className="ai-ind-label">Depression</span>
                    <Chip
                      text={
                        typeof mh.depressionSigns === "boolean"
                          ? mh.depressionSigns
                            ? "Yes"
                            : "No"
                          : "—"
                      }
                      tone={
                        typeof mh.depressionSigns === "boolean"
                          ? mh.depressionSigns
                            ? "red"
                            : "green"
                          : "gray"
                      }
                    />
                  </div>
                  <div className="ai-ind-item">
                    <span className="ai-ind-label">Risk</span>
                    <Chip
                      text={mh.riskLevel ?? "—"}
                      tone={levelTone(mh.riskLevel)}
                    />
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
                      {(k.emotional || []).map((w, i) => (
                        <Chip key={`e-${i}`} text={w} tone="indigo" />
                      ))}
                      {(!k.emotional || !k.emotional.length) && (
                        <span className="ai-empty">—</span>
                      )}
                    </div>
                  </div>
                  <div className="ai-kw-group">
                    <div className="ai-kw-title">Behavioral</div>
                    <div className="ai-kw-chips">
                      {(k.behavioral || []).map((w, i) => (
                        <Chip key={`b-${i}`} text={w} tone="pink" />
                      ))}
                      {(!k.behavioral || !k.behavioral.length) && (
                        <span className="ai-empty">—</span>
                      )}
                    </div>
                  </div>
                  <div className="ai-kw-group">
                    <div className="ai-kw-title">Physical</div>
                    <div className="ai-kw-chips">
                      {(k.physical || []).map((w, i) => (
                        <Chip key={`p-${i}`} text={w} tone="green" />
                      ))}
                      {(!k.physical || !k.physical.length) && (
                        <span className="ai-empty">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="ai-section">
                <div className="ai-section-title">Improvement Suggestions</div>

                <div className="ai-sugg">
                  <div className="ai-sugg-title">Immediate</div>
                  <List items={sug.immediateActions} />
                </div>

                <div className="ai-sugg">
                  <div className="ai-sugg-title">Short-term</div>
                  <List items={sug.shortTermGoals} />
                </div>

                <div className="ai-sugg">
                  <div className="ai-sugg-title">Long-term</div>
                  <List items={sug.longTermStrategies} />
                </div>

                <div className="ai-timeframes">
                  <div>
                    ⏱ Immediate: <b>{tf.immediate ?? "—"}</b>
                  </div>
                  <div>
                    📅 Short-term: <b>{tf.shortTerm ?? "—"}</b>
                  </div>
                  <div>
                    🗓 Long-term: <b>{tf.longTerm ?? "—"}</b>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "history" && (
            <div className="ai-section">
              <div
                className="ai-section-title"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Analysis History</span>
                {canLoadHistory && (
                  <button
                    className="ai-mini-btn"
                    onClick={loadHistory}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? "Loading..." : "Refresh"}
                  </button>
                )}
              </div>

              {!canLoadHistory && (
                <div className="ai-empty">
                  Missing <code>journalId</code> – cannot load history.
                </div>
              )}

              {errHistory && (
                <div className="ed-alert" style={{ marginTop: 8 }}>
                  {errHistory}
                </div>
              )}

              {!errHistory && canLoadHistory && (
                <>
                  {loadingHistory ? (
                    <div className="ai-empty">Loading history...</div>
                  ) : history.length ? (
                    <ul className="ai-history-list">
                      {history.map((h) => {
                        const emotion = h.primaryEmotion ?? "—";
                        const sentiment = h.sentiment ?? "—";
                        const dateStr = h.createdAt
                          ? new Date(h.createdAt).toLocaleString()
                          : "—";
                        const preview =
                          (h.context || "")
                            .replace(/\s+/g, " ")
                            .slice(0, 140) +
                          ((h.context || "").length > 140 ? "…" : "");

                        return (
                          <li key={h.id} className="ai-history-item">
                            <div className="ai-history-top">
                              <b className="ai-history-emotion">{emotion}</b>
                              <span className="ai-dot" />
                              <span
                                className={`ai-chip ai-chip--${sentimentTone(
                                  sentiment
                                )}`}
                              >
                                {sentiment}
                              </span>
                              <span className="ai-history-date">{dateStr}</span>
                            </div>
                            {preview && (
                              <div className="ai-history-context">
                                {preview}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="ai-empty">No history found.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="ai-footer">
            <button className="modal-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
