import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { dashboardApi } from '../api/dashboardApi';
import MetricGrid from '../components/MetricGrid';
import CriticalStockAlert from '../components/CriticalStockAlert';
import RecentOrdersCard from '../components/RecentOrdersCard';
import DashboardSkeleton from '../components/DashboardSkeleton';
import './DashboardPage.css';

const REFRESH_INTERVAL_SEC = 60;

const DashboardPage = () => {
  const { toast } = useUI();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC);
  const timerRef = useRef(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const response = await dashboardApi.getMetrics();
      setData(response);
      setCountdown(REFRESH_INTERVAL_SEC); // Reset countdown on success
    } catch (error) {
      console.error('Dashboard verileri alınırken hata oluştu', error);
      
      // MOCK DATA IF BACKEND IS NOT READY YET
      if (!data) {
        toast('Backend bağlanamadı. Örnek veriler yükleniyor.', 'warning');
        setData({
          totalRevenue: 124500.50,
          todayRevenue: 4320.00,
          totalUsersCount: 1543,
          newUsersTodayCount: 12,
          totalOrdersCount: 3254,
          todayOrdersCount: 28,
          totalProductsCount: 845,
          totalStockCount: 12450,
          lowStockThreshold: 30,
          lowStockProductsCount: 3,
          criticalStockProducts: [
            { id: '1', name: 'Kablosuz Kulaklık Pro', stock: 0, price: 1299.99 },
            { id: '2', name: 'Akıllı Saat X', stock: 5, price: 2499.00 },
            { id: '3', name: 'Telefon Kılıfı Şeffaf', stock: 28, price: 149.99 }
          ],
          recentOrders: [
            { id: '101', orderNumber: 'ORD-A1B2', userEmail: 'ahmet@example.com', customerName: 'Ahmet Yılmaz', totalAmount: 1299.99, status: 'Paid', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: '102', orderNumber: 'ORD-C3D4', userEmail: 'ayse@test.com', customerName: 'Ayşe Demir', totalAmount: 450.00, status: 'Pending', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
            { id: '103', orderNumber: 'ORD-E5F6', userEmail: 'mehmet@demo.com', totalAmount: 2499.00, status: 'Shipped', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
            { id: '104', orderNumber: 'ORD-G7H8', userEmail: 'fatma@example.com', customerName: 'Fatma Şahin', totalAmount: 149.99, status: 'Cancelled', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
            { id: '105', orderNumber: 'ORD-I9J0', userEmail: 'can@test.com', totalAmount: 899.50, status: 'Completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
          ]
        });
      } else {
        toast('Yenileme başarısız.', 'error');
      }
    } finally {
      if (!isSilent) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh timer setup
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true);
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualRefresh = () => {
    fetchDashboardData(true);
    setCountdown(REFRESH_INTERVAL_SEC);
  };

  if (loading && !data) {
    return (
      <div className="page-container">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        
        <div className="refresh-control glass">
          <div className="countdown-ring" style={{ '--progress': `${(countdown / REFRESH_INTERVAL_SEC) * 100}%` }}>
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className="circle"
                strokeDasharray={`${(countdown / REFRESH_INTERVAL_SEC) * 100}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="countdown-text">{countdown}s</span>
          </div>
          <button 
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={handleManualRefresh}
            title="Şimdi Yenile"
            disabled={refreshing}
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      <MetricGrid data={data} />
      
      <CriticalStockAlert 
        threshold={data?.lowStockThreshold || 30} 
        count={data?.lowStockProductsCount || 0}
        products={data?.criticalStockProducts || []} 
      />
      
      <RecentOrdersCard orders={data?.recentOrders || []} />
    </div>
  );
};

export default DashboardPage;
