import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/LoginPage.css";
import { login, register, loginWithGoogle } from "../../services/authService";
import EmailNotification from "../common/EmailNotification";
import "../style/EmailNotification.css";

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

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    login: false,
    register: false,
    confirm: false,
  });

  const handleRegisterClick = () => {
    containerRef.current?.classList.add("login-active");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLoginClick = () => {
    containerRef.current?.classList.remove("login-active");
  };

  const handleBackHome = () => {
    navigate("/");
  };

  // --- REGISTER ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    if (!regEmail || !regPassword) {
      setRegisterError("Please enter both email and password.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegisterError("Password confirmation does not match.");
      return;
    }

    try {
      setRegisterLoading(true);
      const data = await register({ email: regEmail, password: regPassword });
      const msg =
        data?.message ||
        "Registration successful! Please check your email (including spam folder) for the verification code.";
      setRegisterSuccess(msg);

      localStorage.setItem("pending_verify_email", regEmail);
      setRegisteredEmail(regEmail);
      setShowEmailNotification(true);

      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");

      // Navigate to verify page immediately
      navigate(`/verify?email=${encodeURIComponent(regEmail)}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Register failed.";
      setRegisterError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  // --- LOGIN ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    try {
      setLoginLoading(true);
      const data = await login({ email: loginEmail, password: loginPassword });

      // Chuẩn hóa dữ liệu backend
      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken;
      const refresh = data?.refreshToken || data?.data?.refreshToken;
      const userObj = data?.user || data?.data?.user || {};

      // Xác định role chắc ăn
      let role = "user";
      if (userObj?.role) {
        role = String(userObj.role).toLowerCase();
      } else if (data?.role) {
        role = String(data.role).toLowerCase();
      } else if (data?.data?.role) {
        role = String(data.data.role).toLowerCase();
      } else if (Array.isArray(userObj?.roles)) {
        role = userObj.roles
          .map((r) => String(r).toLowerCase())
          .includes("admin")
          ? "admin"
          : "user";
      } else if (userObj?.isAdmin) {
        role = "admin";
      } else if (token) {
        // Fallback: đọc role từ JWT nếu backend chỉ nhét role trong token
        const jwtRole = decodeJwtRole(token);
        if (jwtRole) role = jwtRole;
      }

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token); // lưu thêm cho chắc
      }
      if (refresh) localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", role);
      if (Object.keys(userObj).length > 0) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      setLoginSuccess("Login successful!");
      setLoginEmail("");
      setLoginPassword("");

      // Điều hướng theo role
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true }); // về trang chủ (tránh /home nếu không có route)
        }
      }, 400);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed.";
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleCloseEmailNotification = () => {
    setShowEmailNotification(false);
    // Navigate to verify page when user closes notification
    if (registeredEmail) {
      navigate(`/verify?email=${encodeURIComponent(registeredEmail)}`);
    }
  };

  return (
    <div className="login-root">
      <button
        className="login-back-home-btn"
        onClick={handleBackHome}
        type="button"
      >
        ← Back to Home
      </button>

      <div className="login-container" ref={containerRef}>
        {/* LOGIN FORM */}
        <div className="login-form-box login-login">
          <form onSubmit={handleLoginSubmit}>
            <h1>Login</h1>
            <div className="login-input-box">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="login-input-box">
              <input
                type={showPasswords.login ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("login")}
              >
                {showPasswords.login ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <div className="login-forgot-link">
              <a href="/forgot-password">Forgot password?</a>
            </div>
            <button type="submit" className="login-btn" disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login"}
            </button>

            {/* Google Login */}
            <button
              type="button"
              className="login-btn"
              style={{ marginTop: "10px", backgroundColor: "#db4437" }}
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>

            <div className="login-notification-area">
              {loginError && (
                <div className="login-token-notice login-error">
                  {loginError}
                </div>
              )}
              {loginSuccess && (
                <div className="login-token-notice login-success">
                  {loginSuccess}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className="login-form-box login-register">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Register</h1>
            <div className="login-input-box">
              <input
                type="email"
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
            <button
              type="submit"
              className="login-btn"
              disabled={registerLoading}
            >
              {registerLoading ? "Registering..." : "Register"}
            </button>

            <div className="login-notification-area">
              {registerError && (
                <div className="login-token-notice login-error">
                  {registerError}
                </div>
              )}
              {registerSuccess && (
                <div className="login-token-notice login-success">
                  {registerSuccess}
                </div>
              )}
            </div>
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
            <button
              className="login-btn"
              type="button"
              onClick={handleLoginClick}
            >
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
    </div>
  );
};

export default LoginPage;
