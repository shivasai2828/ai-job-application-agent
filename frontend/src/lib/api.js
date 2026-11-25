import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
  timeout: 60000, // sending an email with an attachment can be slow
});

// Every failed request shows ONE toast from here.
// So in components/hooks do NOT toast errors again, just handle UI state.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    let message = error.response?.data?.message;

    // Blob requests (resume download) return the error body as a Blob
    if (!message && typeof Blob !== "undefined" && error.response?.data instanceof Blob) {
      try {
        message = JSON.parse(await error.response.data.text())?.message;
      } catch {
        // ignore parse errors
      }
    }

    if (!message) {
      if (error.code === "ECONNABORTED") message = "Request timed out";
      else if (error.request && !error.response)
        message = "Cannot reach the server. Is the backend running?";
      else message = error.message || "Something went wrong";
    }

    toast.error(message, { id: message }); // same message = deduped
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
