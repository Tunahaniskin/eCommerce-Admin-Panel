import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../../../shared/utils/axiosInstance';

const AuthContext = createContext();

export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    // .NET claim mapping uyumluluğu
    const email = parsed.email || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    const role = parsed.role || parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const permissions = parsed.permissions || parsed.permission || (Array.isArray(parsed.perms) ? parsed.perms : []);

    return {
      ...parsed,
      email,
      role: typeof role === 'string' ? { name: role } : (role || { name: 'User' }),
      permissions: Array.isArray(permissions) ? permissions : (permissions ? [permissions] : []),
    };
  } catch (e) {
    console.error('Token parse hatası:', e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (token) {
      const decodedToken = parseJwt(token);
      if (decodedToken) {
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            // SuperAdmin yetkisi
            if (storedUser.roleName === 'SuperAdmin' && (!storedUser.permissions || storedUser.permissions.length === 0)) {
              storedUser.permissions = ['*'];
            }
            setUser({ ...decodedToken, ...storedUser });
          } catch (e) {
            setUser(decodedToken);
          }
        } else {
          setUser(decodedToken);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      
      // Token string, { token: "..." }, { accessToken: "..." } veya { data: "..." } olabilir
      let rawToken = response.data;
      if (rawToken && typeof rawToken === 'object') {
        rawToken = rawToken.token || rawToken.accessToken || rawToken.jwt || rawToken.data;
      }

      if (!rawToken || typeof rawToken !== 'string') {
        console.error('Beklenen token formatı alınamadı:', response.data);
        return { success: false, error: 'Sunucudan geçerli bir token alınamadı.' };
      }

      localStorage.setItem('token', rawToken);
      const decodedUser = parseJwt(rawToken);

      // Backend'in gönderdiği UserProfileDto verisini al
      let userProfile = response.data.user || {};
      if (userProfile.roleName === 'SuperAdmin') {
        userProfile.permissions = ['*'];
      }

      localStorage.setItem('user', JSON.stringify(userProfile));

      setUser({ ...decodedUser, ...userProfile });
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Giriş yapılamadı.';
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Kullanıcı adı veya şifre hatalı.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    // SuperAdmin her şeye yetkilidir veya spesifik yetkiye sahiptir
    const perms = user.permissions || [];
    return perms.includes('*') || perms.includes(permission);
  };

  const updateUser = (newUserData) => {
    setUser(prev => {
      const updated = { ...prev, ...newUserData };
      // LocalStorage'ı da güncelle
      const storedStr = localStorage.getItem('user');
      if (storedStr) {
        try {
          const stored = JSON.parse(storedStr);
          localStorage.setItem('user', JSON.stringify({ ...stored, ...newUserData }));
        } catch(e) {}
      }
      return updated;
    });
  };

  if (loading) return <div>Loading...</div>; // TODO: Güzel bir yükleniyor ekranı eklenebilir

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
