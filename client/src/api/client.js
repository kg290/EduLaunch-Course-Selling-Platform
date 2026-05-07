import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const resolveApiOrigin = () => {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return new URL(API_BASE_URL).origin;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:5000";
};

export const API_ORIGIN = resolveApiOrigin();

export const toAssetUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(rawValue)) {
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
