import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/LoginPage.css";
import { login, register, loginWithGoogle } from "../../services/authService";
import EmailNotification from "../common/EmailNotification";
import "../style/EmailNotification.css";

/** -------------------- Tiny Toast system -------------------- */
const useToast = () => {
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', text }
  const timerRef = useRef(null);

  const showToast = (text, type = "info", duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ text, type });
    timerRef.current = setTimeout(() => setToast(null), duration);
  };
  const hideToast = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  };
  return { toast, showToast, hideToast };
};

function decodeJwtRole(token) {
  try {
    const payloadPart = token?.split(".")[1];
    if (!payloadPart) return null;
    const json = JSON.parse(atob(payloadPart));
    if (typeof json?.role === "string") return String(json.role).toLowerCase();
    if (Array.isArray(json?.roles)) {
      return json.roles.map((r) => String(r).toLowerCase()).includes("admin")
        ? "admin"
        : null;
    }
    if (json?.isAdmin === true) return "admin";
    return null;
  } catch {
    return null;
  }
}

const LoginPage = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // toast
  const { toast, showToast, hideToast } = useToast();

  // giữ email mới nhất để khôi phục nếu form bị reset/mount lại
  const latestEmailRef = useRef("");

  // ref ô password để focus lại nhanh
  const passwordInputRef = useRef(null);

  // Recent emails (cho datalist)
  const [recentEmails, setRecentEmails] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recent_emails");
      if (raw) setRecentEmails(JSON.parse(raw));
    } catch { /* empty */ }
  }, []);

  const saveRecentEmail = (email) => {
    try {
      const raw = localStorage.getItem("recent_emails");
      const arr = raw ? JSON.parse(raw) : [];
      const next = [email, ...arr.filter((e) => e !== email)].slice(0, 5);
      localStorage.setItem("recent_emails", JSON.stringify(next));
      setRecentEmails(next);
    } catch { /* empty */ }
  };

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [loginError, setLoginError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [loginSuccess, setLoginSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [registerError, setRegisterError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Password visibility
  const [showPasswords, setShowPasswords] = useState({
    login: false,
    register: false,
    confirm: false,
  });

  const handleRegisterClick = () => {
    containerRef.current?.classList.add("login-active");
  };
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const handleLoginClick = () => {
    containerRef.current?.classList.remove("login-active");
  };
  const handleBackHome = () => navigate("/");

  // --- REGISTER ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    if (!regEmail || !regPassword) {
      const msg = "Please enter both email and password.";
      setRegisterError(msg);
      showToast(msg, "error");
      return;
    }
    if (regPassword !== regConfirm) {
      const msg = "Password confirmation does not match.";
      setRegisterError(msg);
      showToast(msg, "error");
      return;
    }

    try {
      setRegisterLoading(true);
      const data = await register({ email: regEmail, password: regPassword });
      const msg =
        data?.message ||
        "Registration successful! Please check your email (including spam folder) for the verification code.";
      setRegisterSuccess(msg);
      showToast("Registration successful. Please verify your email.", "success");

      localStorage.setItem("pending_verify_email", regEmail);
      setRegisteredEmail(regEmail);
      setShowEmailNotification(true);

      // lưu email gần đây
      saveRecentEmail(regEmail);

      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");

      navigate(`/verify?email=${encodeURIComponent(regEmail)}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed.";
      setRegisterError(msg);
      showToast(msg, "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  // --- LOGIN ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();                 // CHẶN SUBMIT NGAY
    setLoginError("");
    setLoginSuccess("");

    if (!loginEmail || !loginPassword) {
      const msg = "Please enter both email and password.";
      setLoginError(msg);
      showToast(msg, "error");
      setLoginPassword("");             // chỉ xoá password
      passwordInputRef.current?.focus();
      return;
    }

    latestEmailRef.current = loginEmail;

    try {
      setLoginLoading(true);
      const data = await login({ email: loginEmail, password: loginPassword });

      // Chuẩn hoá response
      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken;
      const refresh = data?.refreshToken || data?.data?.refreshToken;
      const userObj = data?.user || data?.data?.user || {};

      // Role
      let role = "user";
      if (userObj?.role) role = String(userObj.role).toLowerCase();
      else if (data?.role) role = String(data.role).toLowerCase();
      else if (data?.data?.role) role = String(data.data.role).toLowerCase();
      else if (Array.isArray(userObj?.roles)) {
        role = userObj.roles.map((r) => String(r).toLowerCase()).includes("admin")
          ? "admin"
          : "user";
      } else if (userObj?.isAdmin) role = "admin";
      else if (token) {
        const jwtRole = decodeJwtRole(token);
        if (jwtRole) role = jwtRole;
      }

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
      }
      if (refresh) localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", role);
      if (Object.keys(userObj).length > 0) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // lưu email gần đây
      saveRecentEmail(loginEmail);

      setLoginSuccess("Login successful!");
      showToast("Signed in successfully.", "success");

      setTimeout(() => {
        if (role === "admin") navigate("/admin/dashboard", { replace: true });
        else navigate("/", { replace: true });
      }, 400);
    } catch (err) {
      // Thông báo thân thiện + giữ email, xoá password, focus lại
      let msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed.";
      const status = err?.response?.status;
      if (status === 400 || status === 401) msg = "Incorrect email or password.";

      setLoginError(msg);
      setLoginEmail((prev) => (prev ? prev : latestEmailRef.current));
      setLoginPassword("");
      showToast(msg, "error");
      passwordInputRef.current?.focus();
    } finally {
      setLoginLoading(false);
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = () => {
    showToast("Redirecting to Google…", "info");
    loginWithGoogle();
  };

  const handleCloseEmailNotification = () => {
    setShowEmailNotification(false);
    if (registeredEmail) {
      navigate(`/verify?email=${encodeURIComponent(registeredEmail)}`);
    }
  };

  return (
    <div className="login-root">
      {/* Floating Toast (top-right) */}
      {toast && (
        <div
          className={`login-toast login-toast-${toast.type}`}
          onClick={hideToast}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            right: "18px",
            top: "calc(18px + env(safe-area-inset-top))",
            zIndex: 9999,
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            background:
              toast.type === "success"
                ? "#12B981"
                : toast.type === "error"
                ? "#EF4444"
                : "#3B82F6",
            color: "#fff",
            cursor: "pointer",
            maxWidth: "86vw",
            fontWeight: 500,
          }}
          title="Click to dismiss"
        >
          {toast.text}
        </div>
      )}

      <button className="login-back-home-btn" onClick={handleBackHome} type="button">
        ← Back to Home
      </button>

      <div className="login-container" ref={containerRef}>
        {/* LOGIN FORM */}
        <div className="login-form-box login-login">
          <form
            onSubmit={handleLoginSubmit}
            action="javascript:void(0)"
            noValidate
            autoComplete="on"
          >
            <h1>Login</h1>
            <div className="login-input-box">
              <input
                type="email"
                name="email"
                autoComplete="email"
                list="recent-emails"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => {
                  latestEmailRef.current = e.target.value;
                  setLoginEmail(e.target.value);
                }}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="login-input-box">
              <input
                ref={passwordInputRef}
                type={showPasswords.login ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={() => {
                  togglePasswordVisibility("login");
                  setTimeout(() => passwordInputRef.current?.focus(), 0);
                }}
              >
                {showPasswords.login ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <div
              className="login-remember-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div className="login-forgot-link">
                <a href="/forgot-password">Forgot password?</a>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              className="login-btn"
              style={{ marginTop: "10px", backgroundColor: "#db4437" }}
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className="login-form-box login-register">
          <form
            onSubmit={handleRegisterSubmit}
            action="javascript:void(0)"
            noValidate
            autoComplete="on"
          >
            <h1>Register</h1>
            <div className="login-input-box">
              <input
                type="email"
                name="email"
                autoComplete="email"
                list="recent-emails"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="login-input-box">
              <input
                type={showPasswords.register ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("register")}
              >
                {showPasswords.register ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <div className="login-input-box">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <button type="submit" className="login-btn" disabled={registerLoading}>
              {registerLoading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>

        {/* TOGGLE */}
        <div className="login-toggle-box">
          <div className="login-toggle-panel login-toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don&apos;t have an account?</p>
            <button
              className="login-btn register-btn"
              type="button"
              onClick={handleRegisterClick}
            >
              Register
            </button>
          </div>
          <div className="login-toggle-panel login-toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="login-btn" type="button" onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Email Notification */}
      <EmailNotification
        isVisible={showEmailNotification}
        email={registeredEmail}
        onClose={handleCloseEmailNotification}
      />

      {/* Datalist for recent emails */}
      <datalist id="recent-emails">
        {recentEmails.map((em) => (
          <option key={em} value={em} />
        ))}
      </datalist>
    </div>
  );
};

export default LoginPage;
