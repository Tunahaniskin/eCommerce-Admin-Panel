import React, { useState, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import './OrdersPage.css';
import { orderApi } from '../api/orderApi';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast, confirm } = useUI();

  // Filtre durumları
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    timeRange: '', // Yeni: Hızlı zaman filtresi
    startDate: '',
    endDate: ''
  });
  const [searchInput, setSearchInput] = useState('');

  // Detay Modalı durumları
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Debounce arama metni için
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let apiFilters = { ...filters };

      // Hızlı zaman aralığı seçiliyse startDate ve endDate'i otomatik hesapla
      if (apiFilters.timeRange) {
        const now = new Date();
        const start = new Date(now);

        if (apiFilters.timeRange === '30m') start.setMinutes(now.getMinutes() - 30);
        else if (apiFilters.timeRange === '1h') start.setHours(now.getHours() - 1);
        else if (apiFilters.timeRange === '24h') start.setHours(now.getHours() - 24);
        else if (apiFilters.timeRange === '7d') start.setDate(now.getDate() - 7);

        // ISO formatında backend'e gönder (ör: 2026-10-07T13:30:00.000Z)
        apiFilters.startDate = start.toISOString();
        apiFilters.endDate = now.toISOString();
      }

      // Backend'e apiFilters gönderiyoruz
      const data = await orderApi.getOrders(apiFilters);
      setOrders(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      toast('Siparişler yüklenemedi.', 'error');

      // Mock data for UI testing if backend not ready
      if (orders.length === 0) {
        setOrders([
          { id: 'ORD-123', userEmail: 'customer1@example.com', totalAmount: 1499.99, status: 'Paid', date: new Date().toISOString() },
          { id: 'ORD-124', userEmail: 'customer2@example.com', totalAmount: 50.00, status: 'Pending', date: new Date(Date.now() - 3600000).toISOString() },
          { id: 'ORD-125', userEmail: 'customer3@example.com', totalAmount: 850.00, status: 'Cancelled', date: new Date(Date.now() - 7200000).toISOString() },
          { id: 'ORD-126', userEmail: 'customer1@example.com', totalAmount: 320.00, status: 'Refunded', date: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.search, filters.status, filters.timeRange, filters.startDate, filters.endDate]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', status: '', timeRange: '', startDate: '', endDate: '' });
  };

  const handleRefund = (e, order) => {
    if (e) e.stopPropagation();
    confirm(`Bu siparişi iade etmek üzeresiniz. ₺${order.totalAmount.toLocaleString()} tutar müşterinin cüzdanına aktarılacak ve ürün stokları geri yüklenecektir. Onaylıyor musunuz?`, async () => {
      try {
        await orderApi.refundOrder(order.id);
        toast('Sipariş başarıyla iade edildi.', 'success');
        fetchOrders();
        // Detay penceresi açıksa durumu güncelle
        if (showDetails && selectedOrder?.id === order.id) {
          setSelectedOrder(prev => ({ ...prev, status: 'Refunded' }));
        }
      } catch (error) {
        toast('İade işlemi sırasında hata oluştu.', 'error');
        // Backend tam hazır değilse mock için güncelle
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Refunded' } : o));
        if (showDetails && selectedOrder?.id === order.id) {
          setSelectedOrder(prev => ({ ...prev, status: 'Refunded' }));
        }
      }
    });
  };

  const handleOpenDetails = async (orderId) => {
    setShowDetails(true);
    setDetailsLoading(true);
    // Modal açıldığında hızlı göstermek için mevcut listeden yüzeysel veriyi de setleyebiliriz
    const partialOrder = orders.find(o => o.id === orderId);
    setSelectedOrder(partialOrder || { id: orderId });

    try {
      const detailedData = await orderApi.getOrderById(orderId);
      // Gelen datanın detay modeli olduğunu varsayıyoruz
      setSelectedOrder(detailedData);
    } catch (error) {
      // Backend getOrderById henüz hazır değilse mock veriler uydurabiliriz
      if (partialOrder) {
        setSelectedOrder({
          ...partialOrder,
          customerName: 'Örnek Müşteri (Mock)',
          shippingAddress: 'İstanbul, Türkiye (Mock Adres)',
          items: [
            { productId: 'PRD-1', productName: 'Örnek Ürün Kalemi 1', quantity: 1, unitPrice: partialOrder.totalAmount, totalPrice: partialOrder.totalAmount }
          ]
        });
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return <span className="chip paid">Ödendi</span>;
      case 'Pending': return <span className="chip pending">Bekliyor</span>;
      case 'Cancelled': return <span className="chip cancelled">İptal Edildi</span>;
      case 'Refunded': return <span className="chip refunded">İade Edildi</span>;
      default: return <span className="chip">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Sipariş Yönetimi</h1>

      {/* Filtreleme Alanı */}
      <div className="filters-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Arama</label>
            <input
              type="text"
              placeholder="Sipariş No veya e-posta ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-control"
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Sipariş Durumu</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-control"
            >
              <option value="">Tümü</option>
              <option value="Paid">Ödendi (Paid)</option>
              <option value="Pending">Bekliyor (Pending)</option>
              <option value="Cancelled">İptal (Cancelled)</option>
              <option value="Refunded">İade Edildi (Refunded)</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Hızlı Zaman Seçimi</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value, startDate: '', endDate: '' })}
              className="form-control"
            >
              <option value="">Özel Tarih Belirle</option>
              <option value="30m">Son 30 Dakika</option>
              <option value="1h">Son 1 Saat</option>
              <option value="24h">Son 24 Saat</option>
              <option value="7d">Son 7 Gün</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px', opacity: filters.timeRange ? 0.6 : 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Tarih Aralığı</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, timeRange: '' })}
                className="form-control"
                disabled={!!filters.timeRange}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, timeRange: '' })}
                className="form-control"
                disabled={!!filters.timeRange}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ height: '42px' }}>Filtrele</button>
            <button type="button" className="btn-clear" style={{ height: '42px' }} onClick={handleClearFilters}>Temizle</button>
          </div>
        </form>
      </div>

      <div className="table-container glass">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Yükleniyor...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Sipariş ID</th>
                <th>Müşteri Bilgisi</th>
                <th>Toplam Tutar</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} onClick={() => handleOpenDetails(order.id)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td style={{ fontWeight: '600' }}>{order.id}</td>
                  <td>{order.userEmail}</td>
                  <td style={{ fontWeight: 'bold' }}>₺{order.totalAmount?.toLocaleString()}</td>
                  <td>{new Date(order.date || order.createdAt || new Date()).toLocaleString('tr-TR')}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <button className="btn-inspect" onClick={(e) => { e.stopPropagation(); handleOpenDetails(order.id); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      İncele
                    </button>
                    {order.status === 'Paid' && (
                      <button className="btn-refund-sm" style={{ marginLeft: '8px' }} onClick={(e) => handleRefund(e, order)}>
                        İade Et
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Hiç sipariş bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Sipariş Detay Modalı */}
      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Sipariş Detayı <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>#{selectedOrder?.id}</span>
              </h2>
              <button className="order-modal-close" onClick={() => setShowDetails(false)} title="Kapat">
                ✕
              </button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Detaylar yükleniyor...</div>
              ) : selectedOrder ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Üst Bilgiler */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Müşteri & Adres Bilgisi</h3>
                      <p style={{ margin: '4px 0' }}><strong>İsim:</strong> {selectedOrder.customerName || '-'}</p>
                      <p style={{ margin: '4px 0' }}><strong>E-posta:</strong> {selectedOrder.userEmail || '-'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Adres:</strong> {selectedOrder.shippingAddress || '-'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Sipariş Bilgisi</h3>
                      <p style={{ margin: '4px 0' }}><strong>Tarih:</strong> {new Date(selectedOrder.date || selectedOrder.createdAt || new Date()).toLocaleString('tr-TR')}</p>
                      <p style={{ margin: '4px 0' }}><strong>Durum:</strong> {getStatusBadge(selectedOrder.status)}</p>
                    </div>
                  </div>

                  {/* Kalemler Tablosu */}
                  <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Sipariş Kalemleri</h3>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <table className="custom-table" style={{ width: '100%' }}>
                        <thead style={{ background: 'var(--bg-primary)' }}>
                          <tr>
                            <th style={{ padding: '10px' }}>Ürün Adı</th>
                            <th style={{ padding: '10px' }}>Birim Fiyat</th>
                            <th style={{ padding: '10px' }}>Adet</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Toplam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px' }}>{item.productName || item.productId}</td>
                              <td style={{ padding: '10px' }}>₺{item.unitPrice?.toLocaleString() || 0}</td>
                              <td style={{ padding: '10px' }}>{item.quantity}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>₺{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                        Ürün kalemleri bulunamadı.
                      </div>
                    )}
                  </div>

                  {/* Alt Toplam ve Aksiyon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div>
                      {selectedOrder.status === 'Paid' && (
                        <button className="btn-primary" style={{ background: 'var(--warning)', color: '#2b3674' }} onClick={(e) => handleRefund(e, selectedOrder)}>
                          Siparişi İade Et (Refund)
                        </button>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '1.2rem' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '16px' }}>Genel Toplam:</span>
                      <strong style={{ color: 'var(--primary)' }}>₺{selectedOrder.totalAmount?.toLocaleString() || 0}</strong>
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>Sipariş detayı bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
