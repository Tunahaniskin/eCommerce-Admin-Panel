import React, { useState } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { categoriesApi } from '../api/categoriesApi';
import '../pages/CategoriesPage.css'; // Reuse CSS

const DeleteCategoryModal = ({ isOpen, onClose, category, allCategories, onSuccess }) => {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState('');

  if (!isOpen || !category) return null;

  const hasProducts = (category.productCount || 0) > 0;
  
  // Exclude the category being deleted from the target list
  const availableTargetCategories = allCategories.filter(cat => cat.id !== category.id);
  const hasOtherCategories = availableTargetCategories.length > 0;

  const handleDelete = async () => {
    if (hasProducts && !targetCategoryId) {
      toast('Lütfen aktarılacak hedef kategoriyi seçin.', 'error');
      return;
    }

    try {
      setLoading(true);
      await categoriesApi.deleteCategory(category.id, hasProducts ? targetCategoryId : null);
      toast('Kategori başarıyla silindi ve işlemler tamamlandı.', 'success');
      onSuccess();
    } catch (error) {
      toast('Kategori silinirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="category-modal-content delete-modal">
        <div className="category-modal-header" style={{ borderBottomColor: 'var(--danger)' }}>
          <h2 style={{ color: 'var(--danger)' }}>Kategoriyi Sil</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="category-modal-body">
          <p className="delete-warning">
            <strong>"{category.name}"</strong> adlı kategoriyi silmek üzeresiniz.
          </p>

          {hasProducts ? (
            <div className="alert alert-warning">
              <p>⚠️ <strong>DİKKAT:</strong> Bu kategoride <strong>{category.productCount}</strong> adet ürün bulunmaktadır.</p>
              <p>Sistemde kategorisiz ürün bulunamayacağı için bu ürünleri aktaracağınız yeni hedef kategoriyi seçmelisiniz.</p>
              
              {!hasOtherCategories ? (
                <div className="alert alert-danger" style={{ marginTop: '16px' }}>
                  <p>❌ <strong>Aktarılacak başka bir kategori bulunmamaktadır!</strong></p>
                  <p>Lütfen bu işlemi iptal edip önce yeni bir kategori oluşturun.</p>
                </div>
              ) : (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Hedef Kategori Seçin *</label>
                  <select 
                    className="form-control" 
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                  >
                    <option value="">-- Yeni Kategori Seçin --</option>
                    {availableTargetCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-info">
              Bu kategoride ürün bulunmamaktadır. Kategori doğrudan silinecektir.
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button className="btn-secondary" onClick={onClose} disabled={loading}>İptal</button>
            <button 
              className="btn-primary" 
              style={{ backgroundColor: 'var(--danger)' }} 
              onClick={handleDelete}
              disabled={loading || (hasProducts && (!hasOtherCategories || !targetCategoryId))}
            >
              {loading ? 'Siliniyor...' : (hasProducts ? 'Ürünleri Taşı ve Sil' : 'Kalıcı Olarak Sil')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
