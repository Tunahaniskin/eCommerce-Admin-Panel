import React, { useState } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { profileApi } from '../api/profileApi';
import { useAuth } from '../../auth/context/AuthContext';

const ChangePasswordForm = () => {
  const { toast } = useUI();
  const { logout } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); // Hata mesajını temizle
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend Validasyonları
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setErrorMsg('Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (formData.currentPassword === formData.newPassword) {
      setErrorMsg('Yeni şifreniz eski şifrenizle aynı olamaz.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // Backend'e şifre değiştirme isteği
      await profileApi.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      
      // Backend başarılı yanıt verirse çalışır
      toast('Şifreniz başarıyla güncellendi.', 'success');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Opsiyonel: Güvenlik gereği çıkış yaptırabilirsiniz
      // toast('Güvenliğiniz için yeniden giriş yapmalısınız.', 'info');
      // setTimeout(() => logout(), 2000);

    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || err.response?.data?.detail || 'Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin veya sunucu bağlantısından emin olun.';
      toast(serverMessage, 'error');
      setErrorMsg(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h3>Şifre Değiştir</h3>
      <p className="form-desc">Hesap güvenliğinizi sağlamak için güçlü bir şifre kullanın.</p>
      
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="form-group">
        <label>Mevcut Şifre</label>
        <input 
          type="password" 
          name="currentPassword" 
          value={formData.currentPassword} 
          onChange={handleChange} 
          className="form-control" 
          placeholder="Mevcut şifrenizi girin"
          required
        />
      </div>

      <div className="form-group">
        <label>Yeni Şifre</label>
        <input 
          type="password" 
          name="newPassword" 
          value={formData.newPassword} 
          onChange={handleChange} 
          className="form-control" 
          placeholder="Yeni şifre (En az 6 karakter)"
          required
        />
      </div>

      <div className="form-group">
        <label>Yeni Şifre (Tekrar)</label>
        <input 
          type="password" 
          name="confirmPassword" 
          value={formData.confirmPassword} 
          onChange={handleChange} 
          className="form-control" 
          placeholder="Yeni şifrenizi doğrulayın"
          required
        />
      </div>

      <div className="form-actions" style={{ marginTop: '24px' }}>
        <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: 'var(--danger)' }}>
          {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
