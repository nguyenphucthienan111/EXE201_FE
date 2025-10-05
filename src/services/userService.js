import api from "./api";

// Lấy profile hiện tại
export async function getMyProfile() {
  const { data } = await api.get("/users/me");
  return data; // { id, email, name, plan, ... }
}

// Cập nhật profile (ví dụ chỉ có name theo spec)
export async function updateMyProfile({ name }) {
  const { data } = await api.put("/users/me", { name });
  return data; // { message: "Updated", ... } hoặc profile mới tuỳ backend
}

// Xoá tài khoản
export async function deleteMyAccount() {
  const { data } = await api.delete("/users/me");
  // dọn localStorage sau khi xoá
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  return data; // { message: "Deleted" }
}

// Lấy thống kê
export async function getMyStats() {
  const { data } = await api.get("/users/stats");
  return data; // { ... } tuỳ backend
}
