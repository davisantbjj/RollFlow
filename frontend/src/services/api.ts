import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';

// Na web, usa o mesmo host da página (localhost no PC); no celular, o IP do PC vindo do env
const BASE_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3333`
    : process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';

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
    } else if (error.response?.status === 403 && error.response.data?.code === 'BLOCKED') {
      // Bloqueado durante o uso: o layout passa a mostrar só Financeiro e Perfil
      useAuthStore.getState().setBlocked(true);
    }
    return Promise.reject(error);
  }
);
