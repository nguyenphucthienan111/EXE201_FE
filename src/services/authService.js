import api from "./api";

// Đăng ký
export async function register({ email, password }) {
  const { data } = await api.post("/auth/register", { email, password });
  return data; // { message: "...", ... }
}

// Verify email
export async function verifyEmail({ email, code }) {
  const { data } = await api.post("/auth/verify", { email, code });
  return data; // { message: "Verified", ... }
}

// Đăng nhập
export async function login({ email, password, rememberMe = false }) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
    rememberMe,
  });
  // chuẩn hoá lưu trữ
  const access = data?.accessToken || data?.token;
  if (access) localStorage.setItem("access_token", access);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

// Google OAuth: mở cửa sổ tới backend
export function loginWithGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL || ""}/auth/google`;
}

// Quên mật khẩu
export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot", { email });
  return data; // { message: "Sent" }
}

// Đặt lại mật khẩu bằng code email
export async function resetPassword({ email, code, newPassword }) {
  const { data } = await api.post("/auth/reset", { email, code, newPassword });
  return data; // { message: "Updated" }
}

// Đổi mật khẩu (đang đăng nhập)
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data; // { message: "Changed" }
}

// Logout
export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  }
}
// Refresh token
export async function refreshToken() {
  const { data } = await api.post("/auth/refresh");
  if (data?.accessToken) {
    localStorage.setItem("access_token", data.accessToken);
  }
  return data;
}
