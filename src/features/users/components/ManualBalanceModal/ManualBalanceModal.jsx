import React, { useState } from 'react';
import { useUI } from '../../../../shared/context/UIContext';
import { usersApi } from '../../api/usersApi';
import './ManualBalanceModal.css';

const ManualBalanceModal = ({ userId, currentBalance, onClose, onSuccess }) => {
  const [actionType, setActionType] = useState('Deposit'); // 'Deposit' or 'Deduct'
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useUI();

  const quickReasons = [
    "Kargo gecikmesi telafisi",
    "Kusurlu ürün iadesi",
    "Sistem hatası düzeltmesi",
    "Özel kampanya ödülü"
  ];

  const parsedAmount = parseFloat(amount) || 0;

  // Calculate preview
  const balanceAfter = actionType === 'Deposit'
    ? currentBalance + parsedAmount
    : currentBalance - parsedAmount;

  const isInvalidDeduct = actionType === 'Deduct' && balanceAfter < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parsedAmount <= 0) {
      toast("Lütfen geçerli bir tutar girin.", "warning");
      return;
    }
    if (isInvalidDeduct) {
      toast("Düşülecek tutar mevcut bakiyeden fazla olamaz.", "error");
      return;
    }
    if (!reason.trim()) {
      toast("Lütfen işlem için bir açıklama (sebep) girin.", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      await usersApi.adjustWalletBalance(userId, {
        amount: parsedAmount,
        actionType,
        reason
      });
      toast("Bakiye başarıyla güncellendi.", "success");
      onSuccess(); // Refresh parent data
    } catch (error) {
      toast("Bakiye güncellenirken hata oluştu: " + (error.response?.data?.message || error.message), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="manual-balance-modal-overlay" onClick={onClose}>
      <div className="manual-balance-modal" onClick={e => e.stopPropagation()}>
        <div className="manual-balance-header">
          <h3>Bakiye İşlemi (Manuel)</h3>
          <button className="manual-balance-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="manual-balance-body">
          <div className="balance-type-selector">
            <button
              type="button"
              className={`type-btn add ${actionType === 'Deposit' ? 'active' : ''}`}
              onClick={() => setActionType('Deposit')}
            >
              + Bakiye Ekle
            </button>
            <button
              type="button"
              className={`type-btn deduct ${actionType === 'Deduct' ? 'active' : ''}`}
              onClick={() => setActionType('Deduct')}
            >
              - Bakiye Düş
            </button>
          </div>

          <div className="form-group">
            <label>İşlem Tutarı</label>
            <div className="amount-input-wrapper">
              <span>₺</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="amount-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="preview-box">
            <div className="preview-row">
              <span>Mevcut Bakiye:</span>
              <span>₺{currentBalance.toFixed(2)}</span>
            </div>
            <div className="preview-row">
              <span>İşlem Tutarı:</span>
              <span style={{ color: actionType === 'Deposit' ? 'var(--success)' : 'var(--danger)' }}>
                {actionType === 'Deposit' ? '+' : '-'} ₺{parsedAmount.toFixed(2)}
              </span>
            </div>
            <div className="preview-row result">
              <span>Yeni Bakiye:</span>
              <span style={{ color: isInvalidDeduct ? 'var(--danger)' : 'var(--text-main)' }}>
                ₺{balanceAfter.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>İşlem Sebebi / Açıklama</label>
            <textarea
              className="reason-input"
              placeholder="Bu işlemin neden yapıldığını açıklayın (Audit log için zorunludur)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="quick-reasons">
              {quickReasons.map((qr, idx) => (
                <span
                  key={idx}
                  className="quick-reason-badge"
                  onClick={() => setReason(qr)}
                >
                  {qr}
                </span>
              ))}
            </div>
          </div>

          <div className="manual-balance-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ background: actionType === 'Deposit' ? 'var(--success)' : 'var(--danger)', border: 'none' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'İşleniyor...' : (actionType === 'Deposit' ? 'Bakiyeyi Ekle' : 'Bakiyeyi Düş')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualBalanceModal;
