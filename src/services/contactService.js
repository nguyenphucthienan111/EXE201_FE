import api from "./api";

export const contactService = {
  /**
   * Send contact message
   * @param {Object} contactData - Contact form data
   * @param {string} contactData.name - User's name
   * @param {string} contactData.email - User's email
   * @param {string} contactData.message - User's message
   * @returns {Promise<Object>} API response
   */
  async sendMessage(contactData) {
    try {
      const response = await api.post("/contact", contactData);
      return response.data;
    } catch (error) {
      console.error("Contact service error:", error);
      throw error;
    }
  },
};

export default contactService;
