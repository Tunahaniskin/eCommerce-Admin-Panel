import React, { useState, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { categoriesApi } from '../api/categoriesApi';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import Pagination from '../components/Pagination';
import './CategoriesPage.css';
import { useAuth } from '../../auth/context/AuthContext';

const CategoriesPage = () => {
  const { toast } = useUI();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('product.create') || hasPermission('product.update');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    resetForm();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getCategories({ page, pageSize });
      
      const list = Array.isArray(data) ? data : (data?.items || []);
      setCategories(list);
      
      // Pagination metadata güncellemeleri
      setTotalCount(data?.totalCount || list.length);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      toast('Kategoriler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      toast('Kategori yönetimi yetkiniz yok.', 'error');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await categoriesApi.updateCategory(editingId, formData);
        toast('Kategori başarıyla güncellendi', 'success');
      } else {
        await categoriesApi.createCategory(formData);
        toast('Kategori başarıyla oluşturuldu', 'success');
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      toast(editingId ? 'Kategori güncellenemedi' : 'Kategori oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name || '', description: cat.description || '' });
  };

  const handleDeleteClick = (cat) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
    fetchCategories();
  };

  return (
    <div className="page-container">
      <div className="table-header-actions" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Kategori Yönetimi</h1>
      </div>

      <div className="category-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {canManage && (
            <div className="category-form-card">
              <h3>{editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h3>
              <form onSubmit={handleSubmit} className="category-form">
                <div className="form-group">
                  <label>Kategori Adı *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="form-control"
                    placeholder="Örn: Elektronik"
                  />
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="form-control"
                    placeholder="Opsiyonel kategori açıklaması"
                  />
                </div>
                <div className="form-actions">
                  {editingId && (
                    <button type="button" className="btn-secondary" onClick={resetForm}>
                      İptal
                    </button>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Ekle')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="category-list-card">
            <h3>Mevcut Kategoriler</h3>
            {loading && categories.length === 0 ? (
              <p>Yükleniyor...</p>
            ) : categories.length === 0 ? (
              <p className="no-data">Henüz kategori bulunmamaktadır.</p>
            ) : (
              <div className="category-list">
                {categories.map(cat => (
                  <div key={cat.id} className="category-item">
                    <div className="category-info">
                      <h4>{cat.name}</h4>
                      {cat.description && <p className="category-desc">{cat.description}</p>}
                      <span className="category-badge">{cat.productCount || 0} Ürün</span>
                    </div>
                    {canManage && (
                      <div className="category-actions">
                        <button className="btn-icon edit" onClick={() => handleEditClick(cat)} title="Düzenle">✏️</button>
                        <button className="btn-icon delete" onClick={() => handleDeleteClick(cat)} title="Sil">🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && categories.length > 0 && (
              <Pagination 
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            )}
          </div>
      </div>

      {deleteModalOpen && categoryToDelete && (
        <DeleteCategoryModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
          }}
          category={categoryToDelete}
          allCategories={categories}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
