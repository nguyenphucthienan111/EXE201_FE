import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/LoginPage.css";

const LoginPage = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleRegisterClick = () => {
    containerRef.current?.classList.add("login-active");
  };

  const handleLoginClick = () => {
    containerRef.current?.classList.remove("login-active");
  };

  const handleBackHome = () => {
    navigate("/");
  };

  const handleRegisterSubmit = (e) => {
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

    // Mock (chưa gắn API)
  setRegisterSuccess("Registration successful (demo)!");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!loginEmail || !loginPassword) {
  setLoginError("Please enter both email and password.");
      return;
    }

    // Mock (chưa gắn API)
  setLoginSuccess("Login successful (demo)!");
    setLoginEmail("");
    setLoginPassword("");
    setTimeout(() => navigate("/"), 1000);
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
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className="login-btn">Login</button>

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
            <button type="submit" className="login-btn">Register</button>

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
