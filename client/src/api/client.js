import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const API_ORIGIN = new URL(API_BASE_URL).origin;

export const toAssetUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }
  return `${API_ORIGIN}${rawValue.startsWith("/") ? rawValue : `/${rawValue}`}`;
};

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
