import React, { useState, useEffect } from 'react';
import './ProductFilters.css';

const ProductFilters = ({ categories, filters, onFilterChange }) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClear = () => {
    setSearchInput('');
    onFilterChange({
      search: '',
      categoryId: '',
      stockStatus: 'all',
      minPrice: '',
      maxPrice: '',
      status: 'active'
    });
  };

  return (
    <div className="product-filters-container">
      <div className="filter-row top-row">
        <div className="filter-group search-group">
          <input
            type="text"
            placeholder="Ürün Ara (Ad veya ID)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="filter-input search-input"
          />
        </div>
        <button className="btn-secondary clear-filters-btn" onClick={handleClear}>
          Filtreleri Temizle
        </button>
      </div>

      <div className="filter-row bottom-row">
        <div className="filter-group">
          <label>Kategori</label>
          <select name="categoryId" value={filters.categoryId || ''} onChange={handleChange} className="filter-select">
            <option value="">Tümü</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Stok Durumu</label>
          <select name="stockStatus" value={filters.stockStatus || 'all'} onChange={handleChange} className="filter-select">
            <option value="all">Tümü</option>
            <option value="in_stock">Stokta Var ({">"}0)</option>
            <option value="low_stock">Kritik Stok (1-5)</option>
            <option value="out_of_stock">Tükendi (0)</option>
          </select>
        </div>

        <div className="filter-group price-group">
          <label>Fiyat Aralığı ($)</label>
          <div className="price-inputs">
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={handleChange}
              className="filter-input price-input"
            />
            <span>-</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={handleChange}
              className="filter-input price-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Durum</label>
          <select name="status" value={filters.status || 'active'} onChange={handleChange} className="filter-select">
            <option value="active">Aktifler</option>
            <option value="deleted">Silinmişler</option>
            <option value="all">Tümü</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
