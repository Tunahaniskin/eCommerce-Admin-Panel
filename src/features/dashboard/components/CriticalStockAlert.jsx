import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CriticalStockAlert.css';

const CriticalStockAlert = ({ threshold = 30, count = 0, products = [] }) => {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return (
      <div className="critical-stock-alert glass safe">
        <div className="alert-header">
          <div className="alert-title-wrapper">
            <span className="alert-icon">✅</span>
            <h3 className="alert-title">Stoklar Güvende</h3>
          </div>
          <span className="alert-subtitle">Kritik eşiğin ({threshold}) altında ürün yok.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="critical-stock-alert glass danger">
      <div className="alert-header">
        <div className="alert-title-wrapper">
          <span className="alert-icon">⚠️</span>
          <h3 className="alert-title">Kritik Stok Uyarısı</h3>
        </div>
        <span className="alert-badge">{count} Ürün</span>
      </div>
      
      <div className="alert-body">
        <p className="alert-description">Aşağıdaki ürünlerin stok seviyesi {threshold} veya altına düşmüştür. Lütfen acilen stok tedarik ediniz.</p>
        
        <div className="stock-list">
          {products.map(product => {
            let statusClass = 'warning';
            let statusText = 'Kritik Eşik';
            if (product.stock === 0) {
              statusClass = 'danger';
              statusText = 'Tükendi';
            } else if (product.stock <= 10) {
              statusClass = 'severe';
              statusText = 'Aşırı Kritik';
            }
            
            return (
              <div key={product.id} className="stock-item">
                <div className="stock-item-info">
                  <span className="stock-item-name">{product.name}</span>
                  <span className={`stock-badge ${statusClass}`}>{statusText}</span>
                </div>
                <div className="stock-item-actions">
                  <span className={`stock-count ${product.stock === 0 ? 'zero' : ''}`}>{product.stock} Adet Kaldı</span>
                  <button className="btn-sm btn-outline" onClick={() => navigate(`/products`)}>
                    Stok Ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CriticalStockAlert;
