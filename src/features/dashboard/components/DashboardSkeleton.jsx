import React from 'react';
import './DashboardSkeleton.css';

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title pulse"></div>
        <div className="skeleton-btn pulse"></div>
      </div>
      
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card glass pulse">
            <div className="skeleton-card-top">
              <div className="skeleton-text short"></div>
              <div className="skeleton-circle"></div>
            </div>
            <div className="skeleton-text long mt-3"></div>
            <div className="skeleton-text medium mt-4"></div>
          </div>
        ))}
      </div>
      
      <div className="skeleton-alert glass pulse mt-4"></div>
      <div className="skeleton-table glass pulse mt-4"></div>
    </div>
  );
};

export default DashboardSkeleton;
