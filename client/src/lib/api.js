import axios from 'axios';

const api = axios.create({
  // En prod: VITE_API_URL = https://superpanel-server.railway.app
  // En dev: '/api' → Vite proxy → localhost:3001
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Redirige al login si el token expiró (excepto cuando ya estamos verificando la sesión)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
