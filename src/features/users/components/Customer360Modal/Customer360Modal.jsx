import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/context/AuthContext';
import { usersApi } from '../../api/usersApi';
import ManualBalanceModal from '../ManualBalanceModal/ManualBalanceModal';
import './Customer360Modal.css';

const Customer360Modal = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, wallet, addresses
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const { hasPermission } = useAuth();

  const canManageFinance = hasPermission('finance.manage') || hasPermission('*');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await usersApi.getCustomer360(userId);
      setData(res);
    } catch (err) {
      setError('Müşteri bilgileri alınamadı: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleBalanceSuccess = () => {
    setShowBalanceModal(false);
    fetchData(); // Bakiye işlemi başarılı olunca verileri yenile
  };

  if (loading) {
    return (
      <div className="customer-360-overlay">
        <div className="customer-360-drawer" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <h3>Yükleniyor...</h3>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="customer-360-overlay">
        <div className="customer-360-drawer" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--danger)' }}>Hata</h3>
          <p>{error}</p>
          <button className="btn-secondary" onClick={onClose}>Kapat</button>
        </div>
      </div>
    );
  }

  const { profile, stats, addresses, recentOrders, walletTransactions } = data;

  const renderOverview = () => (
    <div>
      <h3 className="c360-section-title">Finansal Özet</h3>
      <div className="c360-stats-grid">
        <div className="c360-stat-card highlight">
          <span className="label">Güncel Cüzdan Bakiyesi</span>
          <span className="value">₺{(stats?.currentBalance || 0).toFixed(2)}</span>
        </div>
        <div className="c360-stat-card">
          <span className="label">Toplam Harcama</span>
          <span className="value">₺{(stats?.totalSpent || 0).toFixed(2)}</span>
        </div>
        <div className="c360-stat-card">
          <span className="label">Başarılı Siparişler</span>
          <span className="value">{stats?.totalOrdersCount || 0} Adet</span>
        </div>
        <div className="c360-stat-card">
          <span className="label">İade Edilen Siparişler</span>
          <span className="value">{stats?.refundedOrdersCount || 0} Adet</span>
        </div>
      </div>

      <h3 className="c360-section-title">Hesap Detayları</h3>
      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 12px 0', color: 'var(--text-main)' }}><strong>Rol:</strong> {profile?.roleName}</p>
        <p style={{ margin: '0 0 12px 0', color: 'var(--text-main)' }}><strong>Kayıt Tarihi:</strong> {new Date(profile?.createdAt).toLocaleDateString('tr-TR')}</p>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div>
      <h3 className="c360-section-title">Sipariş Geçmişi</h3>
      {recentOrders && recentOrders.length > 0 ? (
        <table className="c360-table">
          <thead>
            <tr>
              <th>Sipariş ID</th>
              <th>Tarih</th>
              <th>Tutar</th>
              <th>Ürün Adedi</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o, idx) => (
              <tr key={idx}>
                <td>{o.orderId}</td>
                <td>{new Date(o.orderDate).toLocaleString('tr-TR')}</td>
                <td>₺{o.totalAmount.toFixed(2)}</td>
                <td>{o.itemCount}</td>
                <td>
                  <span className="c360-status-badge">{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Müşterinin henüz siparişi bulunmuyor.</p>
      )}
    </div>
  );

  const renderWallet = () => (
    <div>
      <h3 className="c360-section-title">Cüzdan Hareketleri</h3>
      {walletTransactions && walletTransactions.length > 0 ? (
        <table className="c360-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem Tipi</th>
              <th>Açıklama</th>
              <th>Tutar</th>
              <th>Kalan Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {walletTransactions.map((t, idx) => {
              const isPositive = t.amount > 0;
              return (
                <tr key={idx}>
                  <td>{new Date(t.createdAt).toLocaleString('tr-TR')}</td>
                  <td>{t.type}</td>
                  <td>
                    {t.description}
                    {t.createdByAdminEmail && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>İşlem Yapan: {t.createdByAdminEmail}</div>}
                  </td>
                  <td className={`trx-amount ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}₺{t.amount.toFixed(2)}
                  </td>
                  <td>₺{t.balanceAfter.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Henüz cüzdan hareketi bulunmuyor.</p>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div>
      <h3 className="c360-section-title">Kayıtlı Teslimat Adresleri</h3>
      {addresses && addresses.length > 0 ? (
        <div className="address-grid">
          {addresses.map((addr, idx) => (
            <div className="address-card" key={idx}>
              <h4>📍 {addr.title}</h4>
              <p><strong>Alıcı:</strong> {addr.recipientName}</p>
              <p><strong>Telefon:</strong> {addr.phoneNumber}</p>
              <p><strong>İl/İlçe:</strong> {addr.city} / {addr.district}</p>
              <p><strong>Adres:</strong> {addr.fullAddress}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Kayıtlı adres bulunamadı.</p>
      )}
    </div>
  );

  return (
    <>
      <div className="customer-360-overlay" onClick={onClose}>
        <div className="customer-360-drawer" onClick={e => e.stopPropagation()}>
          <div className="customer-360-header">
            <div className="c360-title-area">
              <div className="c360-avatar">
                {profile?.fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </div>
              <div className="c360-info">
                <h2>{profile?.fullName || 'İsimsiz Müşteri'}</h2>
                <p>
                  ✉️ {profile?.email}
                  <span className={`c360-status-badge ${profile?.isDeleted ? 'deleted' : ''}`}>
                    {profile?.isDeleted ? 'SİLİNMİŞ' : 'AKTİF'}
                  </span>
                </p>
              </div>
            </div>
            <div className="c360-header-actions">
              {canManageFinance && !profile?.isDeleted && (
                <button className="btn-primary" style={{ background: 'var(--primary)' }} onClick={() => setShowBalanceModal(true)}>
                  + Bakiye İşlemi
                </button>
              )}
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          <div className="c360-tabs">
            <button className={`c360-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Genel Bakış</button>
            <button className={`c360-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Siparişler</button>
            <button className={`c360-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>Cüzdan Hareketleri</button>
            <button className={`c360-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>Adresler</button>
          </div>

          <div className="c360-body">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'wallet' && renderWallet()}
            {activeTab === 'addresses' && renderAddresses()}
          </div>
        </div>
      </div>

      {showBalanceModal && (
        <ManualBalanceModal 
          userId={userId} 
          currentBalance={stats?.currentBalance || 0}
          onClose={() => setShowBalanceModal(false)}
          onSuccess={handleBalanceSuccess}
        />
      )}
    </>
  );
};

export default Customer360Modal;
