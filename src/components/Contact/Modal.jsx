import { useEffect, useRef } from "react";

// eslint-disable-next-line react/prop-types
export default function Modal({ open, onClose, title, children }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();

    if (open) {
      // lưu giá trị cũ (nếu có)
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;

      // khóa scroll cả html + body cho chắc
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      window.addEventListener("keydown", onKey);
      setTimeout(() => boxRef.current?.focus(), 0);

      // cleanup khi đóng modal hoặc unmount
      return () => {
        document.documentElement.style.overflow = prevHtml || "";
        document.body.style.overflow = prevBody || "";
        window.removeEventListener("keydown", onKey);
      };
    } else {
      // đảm bảo không bị kẹt nếu có lần trước chưa cleanup
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal"
        ref={boxRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3 id="modal-title">{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
