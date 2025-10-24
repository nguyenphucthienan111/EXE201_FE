// src/hooks/useJournalAI.js
import { useState, useCallback } from "react";
import { analyze as apiAnalyze, suggestBasic as apiSuggestBasic, suggestAdvanced as apiSuggestAdvanced } from "../services/journalService";

export default function useJournalAI() {
  const [busy, setBusy] = useState(false);

  const analyze = useCallback(async ({ content, journalId }) => {
    setBusy(true);
    try {
      // service đã normalize: { sentiment:{label,score}, keywords:[] }
      return await apiAnalyze({ content, journalId });
    } finally {
      setBusy(false);
    }
  }, []);

  const suggestBasic = useCallback(async ({ mood, topic, journalId }) => {
    setBusy(true);
    try {
      // service normalize: { suggestions:[] }
      return await apiSuggestBasic({ mood, topic, journalId });
    } finally {
      setBusy(false);
    }
  }, []);

  const suggestPlus = useCallback(async ({ mood, topic, journalId }) => {
    setBusy(true);
    try {
      return await apiSuggestAdvanced({ mood, topic, journalId });
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, analyze, suggestBasic, suggestPlus };
}
