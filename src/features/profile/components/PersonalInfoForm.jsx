import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useUI } from '../../../shared/context/UIContext';
import { profileApi } from '../api/profileApi';

const PersonalInfoForm = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useUI();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Component yüklendiğinde AuthContext'ten gelen veya API'den çekilen bilgiyi doldur
    if (user) {
      setFormData({
        firstName: user.firstName || user.name || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
    
    // (Opsiyonel: Eğer Backend'den en güncel datayı tekrar çekmek isterseniz profilApi.getProfile() yapabilirsiniz)
    const fetchLatestProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        setFormData(prev => ({ ...prev, ...data }));
        updateUser(data); // Context'i de güncelle
      } catch (err) {
        // Backend hazır değilse sessizce geç veya mock kullan
      }
    };
    fetchLatestProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend'e güncelleme isteği at (gerçek endpoint)
      await profileApi.updateProfile(formData);
      
      // Backend başarılı yanıt verirse frontend state'ini güncelle
      updateUser(formData);
      toast('Kişisel bilgiler başarıyla güncellendi.', 'success');
    } catch (err) {
      console.error("TAM HATA OBJESİ:", err);
      console.log("BACKEND'DEN GELEN DATA:", err.response?.data);
      const serverMessage = err.response?.data?.message || err.response?.data?.detail || 'Bilgiler güncellenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.';
      toast(serverMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h3>Kişisel Bilgiler</h3>
      <p className="form-desc">Kişisel bilgilerinizi ve iletişim adresinizi buradan güncelleyebilirsiniz.</p>
      
      <div className="form-group-row">
        <div className="form-group">
          <label>Ad</label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Adınız"
          />
        </div>
        <div className="form-group">
          <label>Soyad</label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Soyadınız"
          />
        </div>
      </div>

      <div className="form-group">
        <label>E-posta Adresi</label>
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          className="form-control" 
          placeholder="ornek@sirket.com"
        />
      </div>

      <div className="form-actions" style={{ marginTop: '24px' }}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoForm;
