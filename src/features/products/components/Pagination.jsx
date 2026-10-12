import React from 'react';
import './Pagination.css';

const Pagination = ({ page, pageSize, totalCount, totalPages, onPageChange, onPageSizeChange }) => {
  if (totalCount === 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, page - 2);
      let endPage = Math.min(totalPages, page + 2);

      if (startPage === 1) endPage = 5;
      if (endPage === totalPages) startPage = totalPages - 4;

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Toplam <strong>{totalCount}</strong> kayıttan <strong>{startItem}-{endItem}</strong> arası gösteriliyor
      </div>

      <div className="pagination-controls">
        <select 
          className="page-size-select" 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10 / Sayfa</option>
          <option value={20}>20 / Sayfa</option>
          <option value={50}>50 / Sayfa</option>
        </select>

        <div className="pagination-buttons">
          <button 
            className="page-btn nav-btn" 
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            &laquo; Önceki
          </button>
          
          {getPageNumbers().map((p, idx) => (
            <button 
              key={idx}
              className={`page-btn ${p === page ? 'active' : ''} ${p === '...' ? 'dots' : ''}`}
              disabled={p === '...'}
              onClick={() => p !== '...' && onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button 
            className="page-btn nav-btn" 
            disabled={page === totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
          >
            Sonraki &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
