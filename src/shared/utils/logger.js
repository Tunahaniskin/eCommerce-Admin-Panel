import axios from 'axios';

const BASE_URL = 'http://localhost:5166';

export const logToBackend = async ({ level = 'Error', message, stackTrace = '', metadata = {} }) => {
  try {
    const token = localStorage.getItem('token');
    
    // axiosInstance yerine saf axios kullanıyoruz ki interceptor döngüsüne girmesin
    await axios.post(`${BASE_URL}/api/logs/client`, {
      level,
      message: String(message),
      logType: 'Frontend',
      url: window.location.href,
      stackTrace,
      metadata: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        ...metadata
      }
    }, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  } catch (err) {
    // Backend kapalıysa veya log atarken hata olursa konsola bas, sonsuz döngüye girme
    console.warn('Log backend servisine iletilemedi:', err.message);
  }
};
