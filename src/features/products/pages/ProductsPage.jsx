import React, { useState, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { productsApi } from '../api/productsApi';
import { useAuth } from '../../auth/context/AuthContext';
import { categoriesApi } from '../api/categoriesApi';
import ProductFilters from '../components/ProductFilters';
import Pagination from '../components/Pagination';
import BulkActionsToolbar from '../components/BulkActionsToolbar';
import ProductImageUploader from '../components/ProductImageUploader';
import { API_BASE_URL } from '../../../shared/utils/axiosInstance';
import './ProductsPage.css';

const ProductsPage = () => {
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'list', 'create'
  const [modalView, setModalView] = useState(null); // 'details', 'update', 'delete', null
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [formData, setFormData] = useState({ name: '', price: 0, stock: 0, status: 'In Stock', categoryId: '' });
  const [createFiles, setCreateFiles] = useState([]);
  const [categories, setCategories] = useState([]);

  // Pagination & Filters
  const [filters, setFilters] = useState({ search: '', categoryId: '', stockStatus: 'all', minPrice: '', maxPrice: '', status: 'active', sortBy: 'id', sortOrder: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  const { hasPermission } = useAuth();
  const { toast, confirm } = useUI();

  // Backend'e göre yetki kontrolleri
  const canCreate = hasPermission('product.create');
  const canUpdate = hasPermission('product.update');
  const canDelete = hasPermission('product.delete');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeView === 'list') {
      fetchProductsList();
    }
  }, [activeView, filters, page, pageSize]);

  // ESC tuşuna basıldığında açık modalı kapat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalView) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalView]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  // Ortak Geri Dönme Fonksiyonu
  const goBackToMenu = () => {
    setActiveView('menu');
    setSearchId('');
    setCurrentProduct(null);
    setSelectedImageIndex(0);
    setSelectedIds([]);
    setFormData({ name: '', price: 0, stock: 0, status: 'In Stock', categoryId: '' });
    setCreateFiles([]);
    setModalView(null);
  };

  const closeModal = () => {
    setModalView(null);
    setSearchId('');
    setCurrentProduct(null);
    setSelectedImageIndex(0);
    setFormData({ name: '', price: 0, stock: 0, status: 'In Stock', categoryId: '' });
  };

  // API Hatalarını Çözümleyen Yardımcı Fonksiyon
  const parseApiError = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (data.errors) {
        // ASP.NET Validation Errors
        const messages = [];
        for (const key in data.errors) {
          messages.push(data.errors[key].join(', '));
        }
        return messages.join('\n');
      }
      if (typeof data === 'string') {
        const match = data.match(/System\.\w+Exception: (.*?)</);
        if (match) return match[0].replace('<', '').trim();
        if (data.includes('Exception:')) return data.substring(0, 200) + '...';
      }
      return data.detail || data.title || data.message || error.message;
    }
    return error.message;
  };

  // 1. Liste İşlemleri
  const fetchProductsList = async () => {
    try {
      setLoading(true);
      const params = { ...filters, page, pageSize };
      const data = await productsApi.getProducts(params);
      if (data && typeof data.totalCount !== 'undefined') {
        setProducts(data.items || []);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        setProducts(list);
        setTotalCount(list.length);
        setTotalPages(Math.ceil(list.length / pageSize) || 1);
      }
    } catch (error) {
      toast('Ürünler getirilemedi: ' + parseApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleListProducts = () => {
    setActiveView('list');
    setPage(1);
    setSelectedIds([]);
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id || p.productId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 2. Yeni Ürün Ekleme İşlemleri
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFiles || createFiles.length === 0) {
      toast('Lütfen ürün için en az bir görsel seçin (zorunlu).', 'error');
      return;
    }
    try {
      setLoading(true);
      await productsApi.createProduct(formData, createFiles);
      toast('Ürün ve görselleri başarıyla oluşturuldu!', 'success');
      goBackToMenu();
    } catch (error) {
      toast('Ürün oluşturulamadı:\n' + parseApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Ortak Arama Fonksiyonu (Details, Update, Delete için)
  const searchProductById = async () => {
    if (!searchId) return;
    try {
      setLoading(true);
      const data = await productsApi.getProductById(searchId);
      setCurrentProduct(data);
      setSelectedImageIndex(0);
      if (activeView === 'update') {
        setFormData({
          name: data.name || '',
          price: data.price || 0,
          stock: data.stock || 0,
          status: data.status || 'In Stock',
          categoryId: data.categoryId || ''
        });
      }
    } catch (error) {
      setCurrentProduct(null);
      toast('Ürün bulunamadı: ' + parseApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 5. Ürün Silme İşlemi
  const handleDeleteSubmit = async () => {
    confirm('Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?', async () => {
      try {
        setLoading(true);
        await productsApi.deleteProduct(searchId);
        toast('Ürün başarıyla silindi!', 'success');
        closeModal();
        fetchProductsList();
      } catch (error) {
        toast('Ürün silinemedi:\n' + parseApiError(error), 'error');
      } finally {
        setLoading(false);
      }
    });
  };

  // 6. Listeden Doğrudan Aksiyon Alma
  const handleActionFromList = async (product, action) => {
    const id = product.id || product.productId;
    setSearchId(id);
    setCurrentProduct(product);
    setSelectedImageIndex(0);
    if (action === 'update') {
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        stock: product.stock || 0,
        status: product.status || 'In Stock',
        categoryId: product.categoryId || ''
      });
    }
    setModalView(action);

    // Listeden gelen ürün verisinde detaylı resim listesi (images dizisi) bulunmayabilir.
    // Detay ve güncelleme ekranlarında tüm görselleri eksiksiz gösterebilmek için ID ile çekiyoruz:
    if (id) {
      try {
        const fullProduct = await productsApi.getProductById(id);
        if (fullProduct) {
          setCurrentProduct(fullProduct);
          if (action === 'update') {
            setFormData({
              name: fullProduct.name || '',
              price: fullProduct.price || 0,
              stock: fullProduct.stock || 0,
              status: fullProduct.status || 'In Stock',
              categoryId: fullProduct.categoryId || ''
            });
          }
        }
      } catch (err) {
        console.error('Tam ürün detayı getirilemedi:', err);
      }
    }
  };

  // 7. Ürün Güncelleme İşlemi
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await productsApi.updateProduct(searchId, formData);
      toast('Ürün başarıyla güncellendi!', 'success');
      closeModal();
      fetchProductsList();
    } catch (error) {
      toast('Ürün güncellenemedi:\n' + parseApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  /* --- RENDER HELPERS --- */

  const renderMenu = () => (
    <div className="menu-grid">
      <div className="menu-card" onClick={handleListProducts}>
        <div className="icon">📋</div>
        <h3>Ürünleri Listele</h3>
        <p>Tüm ürünleri tablo halinde görüntüleyin ve yönetin.</p>
      </div>

      {canCreate && (
        <div className="menu-card" onClick={() => setActiveView('create')}>
          <div className="icon">➕</div>
          <h3>Yeni Ürün Ekle</h3>
          <p>Sisteme yeni bir ürün kaydedin.</p>
        </div>
      )}
    </div>
  );

  const renderList = () => (
    <div className="table-container">
      <ProductFilters
        categories={categories}
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                ID {filters.sortBy === 'id' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Image</th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Product Name {filters.sortBy === 'name' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('categoryId')} style={{ cursor: 'pointer' }}>
                Category {filters.sortBy === 'categoryId' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                Price {filters.sortBy === 'price' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                Stock {filters.sortBy === 'stock' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Yükleniyor...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Ürün bulunamadı.</td></tr>
            ) : (
              products.map(product => {
                const pId = product.id || product.productId;
                return (
                  <tr key={pId} style={{ opacity: product.isDeleted ? 0.5 : 1, background: product.isDeleted ? 'var(--bg-main)' : 'inherit' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(pId)}
                        onChange={() => handleSelectOne(pId)}
                      />
                    </td>
                    <td>{pId}</td>
                    <td>
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: 'var(--border)' }}>
                        {product.thumbnailPath || (product.images && product.images.length > 0) ? (
                          <img src={`${API_BASE_URL}${product.thumbnailPath || product.images[0]?.thumbnailPath || ''}`} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No img</div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, textDecoration: product.isDeleted ? 'line-through' : 'none' }}>{product.name}</td>
                    <td>
                      {product.categoryName ? (
                        <span className="category-badge">{product.categoryName}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.isDeleted ? 'out-of-stock' : (product.stock > 0 ? 'in-stock' : 'out-of-stock')}`}>
                        {product.isDeleted ? 'Silinmiş' : (product.status || (product.stock > 0 ? 'In Stock' : 'Out of Stock'))}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" title="Detay" onClick={() => handleActionFromList(product, 'details')}>
                          👁️
                        </button>
                        {canUpdate && !product.isDeleted && (
                          <button className="btn-icon edit" title="Düzenle" onClick={() => handleActionFromList(product, 'update')}>
                            ✏️
                          </button>
                        )}
                        {canDelete && !product.isDeleted && (
                          <button className="btn-icon delete" title="Sil" onClick={() => handleActionFromList(product, 'delete')}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      <BulkActionsToolbar
        selectedIds={selectedIds}
        products={products}
        onClearSelection={() => setSelectedIds([])}
        onSuccess={fetchProductsList}
      />
    </div>
  );

  const renderCreate = () => (
    <div className="form-container">
      <h2 style={{ marginBottom: '24px' }}>Yeni Ürün Ekle</h2>
      <form onSubmit={handleCreateSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label>Ürün Adı *</label>
            <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Kategori *</label>
            <select
              className="form-control"
              required
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">-- Kategori Seçin --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fiyat ($)</label>
            <input type="number" step="0.01" className="form-control" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Stok Miktarı</label>
            <input type="number" className="form-control" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Durum</label>
            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ürün Görselleri *</label>
            <input
              type="file"
              className="form-control"
              multiple
              accept="image/*"
              required
              onChange={(e) => setCreateFiles(Array.from(e.target.files))}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
          {loading ? 'Ekleniyor...' : 'Kaydet'}
        </button>
      </form>
    </div>
  );

  const renderProductImage = () => {
    if (!currentProduct) return null;
    const imgUrl = currentProduct.thumbnailPath || currentProduct.images?.[0]?.thumbnailPath || currentProduct.imagePath || currentProduct.images?.[0]?.imagePath;
    if (imgUrl) {
      return (
        <div style={{ marginBottom: '20px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <img src={`${API_BASE_URL}${imgUrl}`} alt={currentProduct.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      );
    }
    return (
      <div style={{ marginBottom: '20px', textAlign: 'center', padding: '40px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Görsel Yok</span>
      </div>
    );
  };

  const renderProductGallery = () => {
    if (!currentProduct) return null;

    // Görselleri sırala: Kapak resmi en başta, ardından DisplayOrder küçükten büyüğe
    const sortedImages = (currentProduct.images && currentProduct.images.length > 0)
      ? [...currentProduct.images].sort((a, b) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        })
      : [];

    const activeImage = sortedImages[selectedImageIndex] || sortedImages[0];
    const mainImgUrl = activeImage?.imagePath || activeImage?.thumbnailPath || currentProduct.imagePath || currentProduct.thumbnailPath;

    if (!mainImgUrl && sortedImages.length === 0) {
      return (
        <div style={{ marginBottom: '20px', textAlign: 'center', padding: '40px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Görsel Yok</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        {/* Büyük Önizleme Alanı */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '350px',
          background: 'var(--bg-main)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '12px'
        }}>
          {mainImgUrl ? (
            <img
              src={`${API_BASE_URL}${mainImgUrl}`}
              alt={currentProduct.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Görsel Yok</span>
          )}

          {/* Rozetler: Kapak & Sıra Numarası */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
            {activeImage?.isMain && (
              <span style={{
                background: 'linear-gradient(135deg, #ffb300, #ff8f00)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}>
                ⭐ Kapak
              </span>
            )}
            {activeImage?.displayOrder !== undefined && (
              <span style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                Sıra: {activeImage.displayOrder}
              </span>
            )}
          </div>

          {/* Görsel Sayacı (örn: 1 / 4) */}
          {sortedImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              {selectedImageIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>

        {/* Küçük Görseller (Thumbnail Galerisi) */}
        {sortedImages.length > 1 && (
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Tüm Görseller ({sortedImages.length})</span>
              <span style={{ fontSize: '0.75rem' }}>Görüntülemek için tıklayın</span>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              padding: '6px 2px',
              width: '100%'
            }}>
              {sortedImages.map((img, idx) => {
                const isSelected = idx === selectedImageIndex;
                const thumbUrl = img.thumbnailPath || img.imagePath;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '3px',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-main)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.06)' : 'none',
                      outline: 'none',
                      boxShadow: isSelected ? '0 4px 10px rgba(67, 97, 238, 0.25)' : 'none'
                    }}
                    title={`Sıra: ${img.displayOrder}${img.isMain ? ' (Kapak Görseli)' : ''}`}
                  >
                    <img
                      src={`${API_BASE_URL}${thumbUrl}`}
                      alt={`Thumb ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                    {img.isMain && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ffb300',
                        color: '#000',
                        fontSize: '9px',
                        borderRadius: '50%',
                        width: '15px',
                        height: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }}>
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetails = () => {
    if (!currentProduct) return null;
    return (
      <div 
        className="modal-overlay" 
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '1050px', width: '92%', padding: '36px' }}
        >
          <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Ürün Detayı</h2>
            <button className="btn-icon" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '6px' }} onClick={closeModal} title="Kapat">✕</button>
          </div>
          <div className="modal-split-layout">
            <div style={{ alignSelf: 'start', width: '100%' }}>
              {renderProductGallery()}
            </div>
            <div className="details-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label" style={{ fontSize: '0.95rem' }}>ID</span>
                <span className="details-value" style={{ wordBreak: 'break-all', fontSize: '0.9rem', color: 'var(--primary)', fontFamily: 'monospace' }}>#{currentProduct.id || currentProduct.productId}</span>
              </div>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label" style={{ fontSize: '0.95rem' }}>İsim</span>
                <span className="details-value" style={{ fontSize: '1.15rem' }}>{currentProduct.name}</span>
              </div>
              {currentProduct.categoryName && (
                <div className="details-row" style={{ padding: '14px 0' }}>
                  <span className="details-label" style={{ fontSize: '0.95rem' }}>Kategori</span>
                  <span className="details-value" style={{ fontSize: '1.05rem' }}>{currentProduct.categoryName}</span>
                </div>
              )}
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label" style={{ fontSize: '0.95rem' }}>Fiyat</span>
                <span className="details-value" style={{ fontSize: '1.25rem', color: 'var(--success)' }}>${currentProduct.price}</span>
              </div>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label" style={{ fontSize: '0.95rem' }}>Stok</span>
                <span className="details-value" style={{ fontSize: '1.1rem' }}>{currentProduct.stock}</span>
              </div>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label" style={{ fontSize: '0.95rem' }}>Durum</span>
                <span className="details-value">
                  <span className={`badge ${currentProduct.stock > 0 ? 'in-stock' : 'out-of-stock'}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                    {currentProduct.status || (currentProduct.stock > 0 ? 'In Stock' : 'Out of Stock')}
                  </span>
                </span>
              </div>
              {currentProduct.images && currentProduct.images.length > 0 && (
                <div className="details-row" style={{ padding: '14px 0' }}>
                  <span className="details-label" style={{ fontSize: '0.95rem' }}>Görsel Sayısı</span>
                  <span className="details-value" style={{ fontSize: '1.05rem' }}>{currentProduct.images.length} Adet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDelete = () => {
    if (!currentProduct) return null;
    return (
      <div 
        className="modal-overlay" 
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '850px', width: '90%', padding: '36px' }}
        >
          <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h2 style={{ margin: 0, color: 'var(--danger)', fontSize: '1.5rem' }}>Ürün Sil</h2>
            <button className="btn-icon" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '6px' }} onClick={closeModal} title="Kapat">✕</button>
          </div>
          <div className="modal-split-layout">
            <div style={{ alignSelf: 'start', width: '100%' }}>
              {renderProductImage()}
            </div>
            <div className="details-card" style={{ borderColor: 'var(--danger)', padding: '28px' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '20px', fontSize: '1.05rem' }}>
                ⚠️ Aşağıdaki ürünü kalıcı olarak silmek üzeresiniz!
              </p>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label">İsim</span>
                <span className="details-value" style={{ fontSize: '1.15rem' }}>{currentProduct.name}</span>
              </div>
              <div className="details-row" style={{ padding: '14px 0' }}>
                <span className="details-label">Fiyat</span>
                <span className="details-value" style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>${currentProduct.price}</span>
              </div>
              <button className="btn-primary" style={{ background: 'var(--danger)', marginTop: '28px', width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }} onClick={handleDeleteSubmit} disabled={loading}>
                {loading ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUpdate = () => {
    if (!currentProduct) return null;
    return (
      <div 
        className="modal-overlay" 
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '1150px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '36px' }}
        >
          <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Ürün Güncelle</h2>
            <button className="btn-icon" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '6px' }} onClick={closeModal} title="Kapat">✕</button>
          </div>

          <div className="modal-split-layout">
            <div style={{ alignSelf: 'start', width: '100%' }}>
              {renderProductGallery()}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <ProductImageUploader
                  productId={searchId}
                  initialImages={currentProduct.images || []}
                  onImagesChanged={async () => {
                    try {
                      const refreshed = await productsApi.getProductById(searchId);
                      if (refreshed) setCurrentProduct(refreshed);
                    } catch (e) {
                      console.error('Görseller yenilenemedi:', e);
                    }
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Ürün Adı *</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Kategori *</label>
                  <select
                    className="form-control"
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">-- Kategori Seçin --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fiyat ($)</label>
                  <input type="number" step="0.01" className="form-control" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Stok Miktarı</label>
                  <input type="number" className="form-control" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Durum</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '32px', width: '100%', justifyContent: 'center' }}>
                {loading ? 'Güncelleniyor...' : 'Güncellemeyi Kaydet'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="page-container">
      <div className="table-header-actions">
        <h1 className="page-title">Products Management</h1>
      </div>

      {activeView !== 'menu' && (
        <button className="back-btn" onClick={goBackToMenu}>
          ⬅️ Menüye Dön
        </button>
      )}

      {activeView === 'menu' && renderMenu()}
      {activeView === 'list' && renderList()}
      {activeView === 'create' && renderCreate()}

      {modalView === 'details' && renderDetails()}
      {modalView === 'update' && renderUpdate()}
      {modalView === 'delete' && renderDelete()}
    </div>
  );
};

export default ProductsPage;
