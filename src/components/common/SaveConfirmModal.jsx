// src/components/common/SaveConfirmModal.jsx
// eslint-disable-next-line react/prop-types
export default function SaveConfirmModal({ open, onCancel, onConfirm, saving }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Save changes?</h2>
        <p style={{ margin: "8px 0 16px", color: "#6b7280" }}>
          Your journal will be saved and you will return to the dashboard.
        </p>
        <div className="modal-actions">
          <button type="button" className="modal-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-btn" onClick={onConfirm} disabled={saving}>
            {saving ? "Saving..." : "Yes, Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
