import React from 'react';
import StatCard from './StatCard';
import './MetricGrid.css';

const MetricGrid = ({ data }) => {
  if (!data) return null;

  return (
    <div className="metric-grid">
      <StatCard 
        title="Toplam Ciro" 
        value={`₺${(data.totalRevenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
        icon="💰" 
        gradient="blue"
        footerText={`+₺${(data.todayRevenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} bugün`}
        footerIcon="📈"
      />
      <StatCard 
        title="Kullanıcılar" 
        value={(data.totalUsersCount || 0).toLocaleString('tr-TR')}
        icon="👥" 
        gradient="purple"
        footerText={`+${data.newUsersTodayCount || 0} bugün katılan`}
        footerIcon="👋"
      />
      <StatCard 
        title="Siparişler" 
        value={(data.totalOrdersCount || 0).toLocaleString('tr-TR')}
        icon="📦" 
        gradient="green"
        footerText={`${data.todayOrdersCount || 0} sipariş bugün`}
        footerIcon="🛍️"
      />
      <StatCard 
        title="Envanter Durumu" 
        value={(data.totalProductsCount || 0).toLocaleString('tr-TR')}
        icon="🏷️" 
        gradient="orange"
        footerText={`${(data.totalStockCount || 0).toLocaleString('tr-TR')} toplam stok adedi`}
        footerIcon="📊"
      />
    </div>
  );
};

export default MetricGrid;
