import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentOrdersCard.css';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds} saniye önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
};

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'shipped':
    case 'delivered':
      return 'badge-success';
    case 'pending':
    case 'processing':
      return 'badge-warning';
    case 'cancelled':
    case 'failed':
    case 'refunded':
      return 'badge-danger';
    default:
      return 'badge-default';
  }
};

const RecentOrdersCard = ({ orders }) => {
  const navigate = useNavigate();

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <div className="recent-orders-card glass">
      <div className="card-header">
        <h3 className="card-title">Son Siparişler (5)</h3>
        <button className="btn-view-all" onClick={() => navigate('/orders')}>Tümünü Gör</button>
      </div>
      
      <div className="table-responsive">
        <table className="recent-orders-table">
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Müşteri</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th className="text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} onClick={() => navigate('/orders')} className="clickable-row">
                <td className="order-number font-mono">{order.orderNumber}</td>
                <td>
                  <div className="customer-info">
                    <div className="avatar sm">{order.customerName?.charAt(0).toUpperCase() || (order.userEmail && order.userEmail.charAt(0).toUpperCase()) || 'U'}</div>
                    <div className="customer-details">
                      {order.customerName && <span className="customer-name">{order.customerName}</span>}
                      {order.userEmail && <span className="customer-email">{order.userEmail}</span>}
                    </div>
                  </div>
                </td>
                <td className="time-ago">{formatTimeAgo(order.createdAt)}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="text-right amount">
                  ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersCard;
