import api from "./api";

// Lấy profile hiện tại
export async function getMyProfile() {
  const { data } = await api.get("/users/me");
  return data; // { id, email, name, plan, ... }
}

// Cập nhật profile (ví dụ chỉ có name theo spec)
export async function updateMyProfile({ name }) {
  console.log("userService.updateMyProfile called with:", { name });
  console.log("Making PUT request to /users/me");
  const { data } = await api.put("/users/me", { name });
  console.log("Response received:", data);
  return data; // { message: "Updated", ... } hoặc profile mới tuỳ backend
}

// Xoá tài khoản
export async function deleteMyAccount() {
  const { data } = await api.delete("/users/me");
  // dọn localStorage sau khi xoá
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  return data; // { message: "Deleted" }
}

// Lấy thống kê
export async function getMyStats() {
  const { data } = await api.get("/users/stats");
  return data.data; // Extract the actual stats data from the response
}

// Change password
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}

// Change email
export async function changeEmail({ newEmail }) {
  const { data } = await api.post("/users/change-email", { newEmail });
  return data;
}

// Resend verification email
export async function resendVerification() {
  const { data } = await api.post("/users/resend-verification");
  return data;
}

// Upload avatar
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const { data } = await api.post("/users/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

// Remove avatar
export async function removeAvatar() {
  const { data } = await api.delete("/users/avatar");
  return data;
}
