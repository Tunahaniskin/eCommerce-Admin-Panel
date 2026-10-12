import axios from 'axios';
import { logToBackend } from './logger';

export const API_BASE_URL = 'http://localhost:5166';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: Her isteğe JWT Token ekler
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Yetkisiz işlemleri (401) global olarak yakalar ve login'e atar
axiosInstance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  // ⚠️ SONSUZ DÖNGÜ KORUMASI: Log endpoint'inin kendi hatalarını tekrar loglama!
  const isLogEndpoint = error.config?.url?.includes('/api/logs/client');

  if (!isLogEndpoint) {
    const status = error.response?.status;
    
    // Sunucu hatası (500) veya Ağ/Bağlantı hatası durumunda veritabanına yaz
    if (!status || status >= 500) {
      logToBackend({
        level: 'Error',
        message: `API Hatası [${status || 'Ağ Hatası'}]: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        stackTrace: error.stack,
        metadata: {
          responseData: error.response?.data,
          requestPayload: error.config?.data
        }
      });
    }
  }

  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default axiosInstance;
