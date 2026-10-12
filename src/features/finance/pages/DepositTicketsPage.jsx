import React, { useState, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import './DepositTicketsPage.css';
import { financeApi } from '../api/financeApi';

const DepositTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const { toast, confirm } = useUI();
  
  // Reject Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingTicketId, setRejectingTicketId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDepositTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Bakiye talepleri yüklenirken hata:', error);
      toast('Talepler yüklenemedi. ' + (error.response?.data?.message || ''), 'error');
      // Mock data in case backend isn't ready
      if (tickets.length === 0) {
        setTickets([
          { id: 1, userEmail: 'user1@example.com', amount: 500, status: 'Pending', createdAt: new Date().toISOString() },
          { id: 2, userEmail: 'user2@example.com', amount: 1200, status: 'Approved', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, userEmail: 'user3@example.com', amount: 300, status: 'Rejected', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleApprove = (ticket) => {
    confirm(`${ticket.userEmail} kullanıcısının hesabına ${ticket.amount} TL bakiye yüklemek istediğinize emin misiniz?`, async () => {
      try {
        await financeApi.approveTicket(ticket.id);
        toast('Talep başarıyla onaylandı ve bakiye eklendi.', 'success');
        fetchTickets();
      } catch (error) {
        toast('Onaylanırken hata oluştu.', 'error');
        // fallback for mock
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'Approved' } : t));
      }
    });
  };

  const openRejectModal = (ticketId) => {
    setRejectingTicketId(ticketId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingTicketId(null);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast('Lütfen reddetme sebebini giriniz.', 'error');
      return;
    }

    try {
      await financeApi.rejectTicket(rejectingTicketId, rejectReason);
      toast('Talep reddedildi.', 'success');
      closeRejectModal();
      fetchTickets();
    } catch (error) {
      toast('Reddedilirken hata oluştu.', 'error');
      // fallback for mock
      setTickets(prev => prev.map(t => t.id === rejectingTicketId ? { ...t, status: 'Rejected' } : t));
      closeRejectModal();
    }
  };

  // Stats
  const pendingCount = tickets.filter(t => t.status === 'Pending').length;
  const approvedTotal = tickets.filter(t => t.status === 'Approved').reduce((sum, t) => sum + t.amount, 0);
  const rejectedCount = tickets.filter(t => t.status === 'Rejected').length;

  const filteredTickets = tickets.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Finans Yönetimi - Bakiye Talepleri</h1>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(255, 206, 32, 0.1)', color: 'var(--warning)' }}>⏳</div>
          <div className="stat-info">
            <span className="stat-label">Bekleyen Talepler</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(5, 205, 153, 0.1)', color: 'var(--success)' }}>💰</div>
          <div className="stat-info">
            <span className="stat-label">Onaylanan Toplam Bakiye</span>
            <span className="stat-value">₺{approvedTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(238, 93, 80, 0.1)', color: 'var(--danger)' }}>❌</div>
          <div className="stat-info">
            <span className="stat-label">Reddedilenler</span>
            <span className="stat-value">{rejectedCount}</span>
          </div>
        </div>
      </div>

      <div className="filter-buttons glass">
        <button className={`btn-filter ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>Tümü</button>
        <button className={`btn-filter ${filter === 'Pending' ? 'active' : ''}`} onClick={() => setFilter('Pending')}>Bekleyenler</button>
        <button className={`btn-filter ${filter === 'Approved' ? 'active' : ''}`} onClick={() => setFilter('Approved')}>Onaylananlar</button>
        <button className={`btn-filter ${filter === 'Rejected' ? 'active' : ''}`} onClick={() => setFilter('Rejected')}>Reddedilenler</button>
      </div>

      <div className="table-container glass">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Yükleniyor...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Talep ID</th>
                <th>Kullanıcı</th>
                <th>Talep Edilen Tutar</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td>#{ticket.id}</td>
                  <td>{ticket.userEmail}</td>
                  <td style={{ fontWeight: 'bold' }}>₺{ticket.amount.toLocaleString()}</td>
                  <td>{new Date(ticket.createdAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <span className={`chip ${ticket.status.toLowerCase()}`}>
                      {ticket.status === 'Pending' ? 'Bekliyor' : ticket.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                  </td>
                  <td>
                    {ticket.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon view" title="Onayla" onClick={() => handleApprove(ticket)}>
                          ✔️
                        </button>
                        <button className="btn-icon delete" title="Reddet" onClick={() => openRejectModal(ticket.id)}>
                          ❌
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Hiç talep bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Talebi Reddet</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Reddetme Sebebi</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Red sebebini açıklayınız (Örn: Dekont eşleşmedi)"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeRejectModal}>İptal</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--danger)' }}>Talebi Reddet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositTicketsPage;
