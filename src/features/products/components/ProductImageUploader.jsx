import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { productsApi } from '../api/productsApi';
import { API_BASE_URL } from '../../../shared/utils/axiosInstance';
import './ProductImageUploader.css';

const ProductImageUploader = ({ productId, initialImages = [], onImagesChanged }) => {
  const { toast, confirm } = useUI();
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate size and type (basic)
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast(`${f.name} boyutu 5MB'dan büyük olamaz.`, 'error');
        return false;
      }
      if (!f.type.startsWith('image/')) {
        toast(`${f.name} geçersiz dosya tipi.`, 'error');
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    try {
      setIsUploading(true);
      const newImages = await productsApi.uploadImages(productId, validFiles);
      setImages(prev => [...prev, ...newImages]);
      toast('Görseller başarıyla yüklendi.', 'success');
      if (onImagesChanged) onImagesChanged();
    } catch (error) {
      console.error('Image Upload Error:', error, error.response?.data);
      let errorMsg = error.response?.data?.message || error.response?.data?.title || error.message;
      
      // Parse ASP.NET Core HTML Exception if present
      if (typeof error.response?.data === 'string') {
        const match = error.response.data.match(/System\.\w+Exception: (.*?)</);
        if (match) {
          errorMsg = match[0].replace('<', '').trim();
        } else if (error.response.data.includes('Exception:')) {
          errorMsg = error.response.data.substring(0, 200) + '...';
        }
      }
      
      toast(`Görseller yüklenemedi: ${errorMsg}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (imageId) => {
    confirm('Bu görseli kalıcı olarak silmek istediğinize emin misiniz?', async () => {
      try {
        await productsApi.deleteImage(productId, imageId);
        setImages(prev => prev.filter(img => img.id !== imageId));
        toast('Görsel silindi.', 'success');
        if (onImagesChanged) onImagesChanged();
      } catch (error) {
        toast('Görsel silinemedi.', 'error');
      }
    });
  };

  const handleSetMain = async (imageId) => {
    try {
      await productsApi.setMainImage(productId, imageId);
      setImages(prev => prev.map(img => ({
        ...img,
        isMain: img.id === imageId
      })));
      toast('Kapak resmi güncellendi.', 'success');
      if (onImagesChanged) onImagesChanged();
    } catch (error) {
      toast('Kapak resmi ayarlanamadı.', 'error');
    }
  };

  return (
    <div className="image-uploader-container">
      <div className="upload-header">
        <h4>Ürün Görselleri</h4>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !productId}
        >
          {isUploading ? 'Yükleniyor...' : '📁 Görsel Seç'}
        </button>
        <input 
          type="file" 
          multiple 
          accept="image/png, image/jpeg, image/webp" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>

      {!productId && (
        <div className="alert alert-info">
          Görsel yüklemek için önce ürünü oluşturup kaydetmelisiniz.
        </div>
      )}

      {productId && images.length === 0 && !isUploading && (
        <div className="empty-images">
          Henüz görsel eklenmemiş. Sürükle bırak veya klasörden seç.
        </div>
      )}

      {images.length > 0 && (
        <div className="image-gallery">
          {[...images].sort((a, b) => {
            if (a.isMain && !b.isMain) return -1;
            if (!a.isMain && b.isMain) return 1;
            return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
          }).map(img => (
            <div key={img.id} className={`image-card ${img.isMain ? 'is-main' : ''}`}>
              <img src={`${API_BASE_URL}${img.thumbnailPath || img.imagePath || ''}`} alt="Product" className="gallery-img" />
              
              {img.isMain && <span className="main-badge">⭐ Kapak</span>}
              
              <div className="image-overlay">
                {!img.isMain && (
                  <button type="button" className="btn-icon star" onClick={() => handleSetMain(img.id)} title="Kapak Yap">
                    ⭐
                  </button>
                )}
                <button type="button" className="btn-icon delete" onClick={() => handleDelete(img.id)} title="Sil">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
