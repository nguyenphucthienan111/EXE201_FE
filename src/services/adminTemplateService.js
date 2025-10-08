// src/services/adminTemplateService.js
import api from "./api";

/** Admin: Upload a new template */
export async function uploadAdminTemplate({ name, description, category, file }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("category", category);     // backend yêu cầu có field này
  formData.append("template", file);         // TÊN field file phải là "template"

  // Để Axios tự set multipart boundary (tránh 400)
  const { data } = await api.post("/templates/admin", formData);
  return data;
}

/** Admin: Get all templates */
export async function getAdminTemplates() {
  const { data } = await api.get("/templates/admin");
  return data;
}
