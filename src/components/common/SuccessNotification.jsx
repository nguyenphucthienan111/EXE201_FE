import { useState, useEffect } from "react";
import "../style/SuccessNotification.css";

const SuccessNotification = ({ isVisible, message, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`success-notification ${
        isClosing ? "success-notification-closing" : ""
      }`}
    >
      <div className="success-notification-content">
        <div className="success-notification-icon">✅</div>
        <div className="success-notification-text">
          <h3>Success!</h3>
          <p>{message}</p>
        </div>
        <button
          className="success-notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SuccessNotification;

