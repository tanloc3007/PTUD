import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5080/api';

const axiosClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: đính kèm token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('unimind_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: xử lý 401
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosClient;

/** Auth API calls */
export async function login(credentials) {
  const payload = {
    emailOrMSSV: credentials.emailOrMSSV || credentials.email || credentials.mssv,
    email: credentials.email || credentials.emailOrMSSV,
    password: credentials.password,
    role: credentials.role,
  };
  const res = await axiosClient.post('/auth/login', payload);
  return res.data;
}

export async function logout() {
  try {
    await axiosClient.post('/auth/logout');
  } catch {
    // Ignore server errors on logout
  } finally {
    useAuthStore.getState().clearAuth();
  }
}

export async function getMyProfile() {
  const res = await axiosClient.get('/auth/me');
  return res.data;
}

export async function register(data) {
  const res = await axiosClient.post('/auth/register', data);
  return res.data;
}
