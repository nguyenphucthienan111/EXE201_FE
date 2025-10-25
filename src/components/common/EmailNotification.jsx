import { useState, useEffect } from "react";

const EmailNotification = ({ isVisible, email, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`email-notification ${
        isClosing ? "email-notification-closing" : ""
      }`}
    >
      <div className="email-notification-content">
        <div className="email-notification-icon">📧</div>

        <div className="email-notification-text">
          <h3>Check Your Email!</h3>
          <p>
            We've sent a verification code to <strong>{email}</strong>
          </p>
          <div className="email-notification-tips">
            <span>
              💡 Check your <strong>Inbox</strong> and{" "}
              <strong>Spam folder (Thư rác)</strong>
            </span>
          </div>
        </div>

        <button
          className="email-notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default EmailNotification;
