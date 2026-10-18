import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

// Base URL from environment or fallback to localhost for development
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (auto-logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
    }
    return Promise.reject(error);
  }
);
