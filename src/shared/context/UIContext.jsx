import React, { createContext, useContext, useState } from 'react';
import './UIContext.css';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const toast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog && confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  return (
    <UIContext.Provider value={{ toast, confirm: showConfirm }}>
      {children}

      {/* Toasts Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Onay Gerekli</h3>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="modal-btn modal-btn-cancel" onClick={handleCancel}>İptal</button>
              <button className="modal-btn modal-btn-confirm" onClick={handleConfirm}>Evet, Onaylıyorum</button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};
