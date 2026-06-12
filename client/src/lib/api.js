import axios from 'axios';

export const TOKEN_KEY = 'sp_token';

const api = axios.create({
  // En prod: VITE_API_URL = https://superpanel-server.railway.app
  // En dev: '/api' → Vite proxy → localhost:3001
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Adjunta el token JWT (localStorage) como Bearer en cada petición.
// Es la vía principal de auth: Safari iOS bloquea la cookie cross-site.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige al login si el token expiró (excepto cuando ya estamos verificando la sesión)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY); // token vencido/ inválido: límpialo
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
