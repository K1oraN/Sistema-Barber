import axios from "axios";
import { clearStoredAuth, getStoredToken } from "../utils/authStorage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api",
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const isAuthAttempt =
      url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthAttempt) {
      clearStoredAuth();
      window.dispatchEvent(new Event("club-do-rafa:unauthorized"));
    }

    return Promise.reject(error);
  },
);
