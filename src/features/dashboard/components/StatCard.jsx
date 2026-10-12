import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, gradient, footerText, footerIcon }) => {
  return (
    <div className={`stat-card glass ${gradient}`}>
      <div className="stat-card-header">
        <div className="stat-card-info">
          <span className="stat-card-title">{title}</span>
          <h3 className="stat-card-value">{value}</h3>
        </div>
        <div className="stat-card-icon-wrapper">
          <span className="stat-card-icon">{icon}</span>
        </div>
      </div>
      {footerText && (
        <div className="stat-card-footer">
          {footerIcon && <span className="footer-icon">{footerIcon}</span>}
          <span className="footer-text">{footerText}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
