import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('quickserve_user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// Handle 401 globally — log user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('quickserve_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
