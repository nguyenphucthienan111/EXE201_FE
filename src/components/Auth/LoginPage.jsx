import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/LoginPage.css";
import { login, register, loginWithGoogle } from "../../services/authService";

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

  const handleRegisterClick = () => {
    containerRef.current?.classList.add("login-active");
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
        "Registration successful. Please check your email for the verification code.";
      setRegisterSuccess(msg);

      // Lưu email để verify
      localStorage.setItem("pending_verify_email", regEmail);

      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");

      // Chuyển sang trang verify
      setTimeout(() => {
        navigate(`/verify?email=${encodeURIComponent(regEmail)}`);
      }, 800);
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

      const token = data?.accessToken || data?.token;
      const refresh = data?.refreshToken;
      if (token) localStorage.setItem("access_token", token);
      if (refresh) localStorage.setItem("refresh_token", refresh);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      setLoginSuccess("Login successful!");
      setLoginEmail("");
      setLoginPassword("");

      setTimeout(() => navigate("/"), 600);
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

  return (
    <div className="login-root">
      <button className="login-back-home-btn" onClick={handleBackHome} type="button">
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
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
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
              {loginError && <div className="login-token-notice login-error">{loginError}</div>}
              {loginSuccess && <div className="login-token-notice login-success">{loginSuccess}</div>}
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
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="login-input-box">
              <input
                type="password"
                placeholder="Confirm password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="login-btn" disabled={registerLoading}>
              {registerLoading ? "Registering..." : "Register"}
            </button>

            <div className="login-notification-area">
              {registerError && <div className="login-token-notice login-error">{registerError}</div>}
              {registerSuccess && <div className="login-token-notice login-success">{registerSuccess}</div>}
            </div>
          </form>
        </div>

        {/* TOGGLE */}
        <div className="login-toggle-box">
          <div className="login-toggle-panel login-toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don&apos;t have an account?</p>
            <button className="login-btn register-btn" type="button" onClick={handleRegisterClick}>
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
    </div>
  );
};

export default LoginPage;
