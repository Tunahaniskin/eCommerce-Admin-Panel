import React, { useState } from 'react';
import PersonalInfoForm from '../components/PersonalInfoForm';
import ChangePasswordForm from '../components/ChangePasswordForm';
import './ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security'

  return (
    <div className="page-container profile-page">
      <h1 className="page-title">Profil & Ayarlar</h1>
      <p className="page-description">Kişisel hesap bilgilerinizi ve güvenlik tercihlerinizi yönetin.</p>
      
      <div className="profile-layout">
        <aside className="profile-sidebar glass">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <span className="icon">👤</span>
            Genel Bilgiler
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="icon">🔒</span>
            Güvenlik & Şifre
          </button>
        </aside>

        <main className="profile-content glass">
          {activeTab === 'info' && <PersonalInfoForm />}
          {activeTab === 'security' && <ChangePasswordForm />}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
