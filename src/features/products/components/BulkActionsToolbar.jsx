import React, { useState, useEffect } from 'react';
import { useUI } from '../../../shared/context/UIContext';
import { productsApi } from '../api/productsApi';
import { logToBackend } from '../../../shared/utils/logger';
import './BulkActionsToolbar.css';

export const calculateStock = (currentStock, action, value) => {
  const base = parseInt(currentStock, 10);
  const val = parseInt(value, 10);

  if (isNaN(base) || isNaN(val) || base < 0 || val < 0) {
    throw new Error(`calculateStock: Geçersiz değerler (mevcut: ${currentStock}, girilen: ${value}). İşlem güvenlik nedeniyle durduruldu.`);
  }

  switch (action) {
    case 'set':
      return val;
    case 'increase':
      return base + val;
    case 'decrease':
      return Math.max(0, base - val);
    default:
      return val;
  }
};

export const calculatePrice = (currentPrice, action, value) => {
  const base = parseFloat(currentPrice);
  const val = parseFloat(value);

  if (isNaN(base) || isNaN(val) || !isFinite(base) || !isFinite(val) || base < 0 || val < 0) {
    throw new Error(`calculatePrice: Geçersiz değerler (mevcut: ${currentPrice}, girilen: ${value}). Fiyat sıfırlanmasını önlemek için işlem durduruldu.`);
  }

  let result = base;
  switch (action) {
    case 'percent_decrease':
      result = base - (base * val) / 100;
      break;
    case 'percent_increase':
      result = base + (base * val) / 100;
      break;
    case 'fixed_decrease':
      result = base - val;
      break;
    case 'fixed_increase':
      result = base + val;
      break;
    case 'set':
      result = val;
      break;
    default:
      result = val;
      break;
  }

  return Math.max(0, Math.round(result * 100) / 100);
};

const BulkActionsToolbar = ({ selectedIds, products = [], onClearSelection, onSuccess }) => {
  const { toast, confirm } = useUI();
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'stock' or 'price'
  
  // Stock Form State
  const [stockAction, setStockAction] = useState('set');
  const [stockValue, setStockValue] = useState(0);

  // Price Form State
  const [priceAction, setPriceAction] = useState('percent_decrease');
  const [priceValue, setPriceValue] = useState(0);

  const normalizeId = (id) => String(id || '').toLowerCase();

  // Map of loaded products for selected IDs (handles pagination / missing products)
  const [resolvedProducts, setResolvedProducts] = useState([]);

  useEffect(() => {
    if (!activeModal || !selectedIds || selectedIds.length === 0) {
      setResolvedProducts([]);
      return;
    }

    let isMounted = true;
    const existingMap = new Map();
    (products || []).forEach(p => {
      const id = p.id || p.productId;
      if (id) existingMap.set(normalizeId(id), p);
    });

    const missingIds = selectedIds.filter(id => !existingMap.has(normalizeId(id)));

    if (missingIds.length === 0) {
      setResolvedProducts(selectedIds.map(id => existingMap.get(normalizeId(id))).filter(Boolean));
    } else {
      // Asynchronously fetch products missing from current page
      Promise.all(missingIds.map(id => productsApi.getProductById(id).catch(async (err) => {
        await logToBackend({
          level: 'Warning',
          message: `Toplu işlem modalı açılırken ürün detayı getirilemedi: ${id}`,
          metadata: { productId: id, error: err.message }
        });
        return null;
      }))).then(fetched => {
        if (!isMounted) return;
        fetched.forEach(p => {
          if (p) {
            const id = p.id || p.productId;
            existingMap.set(normalizeId(id), p);
          }
        });
        // Sadece gerçek bulunan ürünleri ata, varsayılan sahte 0 objesi asla ekleme!
        const found = selectedIds.map(id => existingMap.get(normalizeId(id))).filter(Boolean);
        setResolvedProducts(found);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeModal, selectedIds, products]);

  const resolveAllProducts = async () => {
    const map = new Map();
    (products || []).forEach(p => {
      const id = p.id || p.productId;
      if (id) map.set(normalizeId(id), p);
    });
    resolvedProducts.forEach(p => {
      const id = p.id || p.productId;
      if (id) map.set(normalizeId(id), p);
    });

    const missingIds = selectedIds.filter(id => !map.has(normalizeId(id)));
    if (missingIds.length > 0) {
      const fetched = await Promise.all(
        missingIds.map(id => productsApi.getProductById(id).catch(async (err) => {
          await logToBackend({
            level: 'Error',
            message: `Toplu işlem için ürün detayı getirilemedi (Ürün ID: ${id}): ${err.message}`,
            metadata: { productId: id, error: err.message }
          });
          return null;
        }))
      );
      fetched.forEach(p => {
        if (p) {
          const id = p.id || p.productId;
          if (id) map.set(normalizeId(id), p);
        }
      });
    }

    // Katı doğrulama: Eksik ürün varsa asla varsayılan 0 objesi verme, işlemi durdur ve DB'ye logla
    const unresolvableIds = selectedIds.filter(id => !map.has(normalizeId(id)));
    if (unresolvableIds.length > 0) {
      const errorMsg = `Seçili ürünlerin (${unresolvableIds.join(', ')}) verilerine ulaşılamadı. Veri kaybını önlemek için varsayılan 0 değeri atanmayıp işlem durduruldu.`;
      await logToBackend({
        level: 'Error',
        message: errorMsg,
        metadata: { unresolvableIds, selectedIds }
      });
      throw new Error(errorMsg);
    }

    return selectedIds.map(id => map.get(normalizeId(id)));
  };

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleBulkDelete = () => {
    confirm(`${selectedIds.length} adet ürünü silmek istediğinize emin misiniz?`, async () => {
      try {
        setLoading(true);
        await productsApi.bulkDelete(selectedIds);
        toast('Seçili ürünler başarıyla silindi.', 'success');
        onClearSelection();
        onSuccess();
      } catch (error) {
        await logToBackend({
          level: 'Error',
          message: `Toplu ürün silme işlemi başarısız: ${error.message}`,
          metadata: { selectedIds, error: error.message }
        });
        toast('Toplu silme işlemi başarısız oldu.', 'error');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleBulkStockSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const parsedStockValue = parseInt(stockValue, 10);
      if (isNaN(parsedStockValue) || parsedStockValue < 0) {
        const errorMsg = `Geçersiz stok miktarı girildi: "${stockValue}". İşlem iptal edildi.`;
        await logToBackend({
          level: 'Warning',
          message: errorMsg,
          metadata: { stockValue, stockAction, selectedIds }
        });
        toast('Lütfen geçerli bir stok miktarı giriniz (0 veya pozitif tam sayı).', 'error');
        setLoading(false);
        return;
      }

      const items = await resolveAllProducts();

      // Tüm seçili ürünlerin mevcut stok verilerini kontrol et
      for (const item of items) {
        const pId = item.id || item.productId;
        const currentStock = parseInt(item.stock, 10);
        if (isNaN(currentStock) || currentStock < 0) {
          const errorMsg = `Ürünün (${item.name || pId}) mevcut stok verisi geçersiz: "${item.stock}". Stokların sıfırlanmasını önlemek için işlem durduruldu.`;
          await logToBackend({
            level: 'Error',
            message: errorMsg,
            metadata: { productId: pId, currentStock: item.stock, stockAction }
          });
          throw new Error(errorMsg);
        }
      }

      if (stockAction === 'set') {
        await productsApi.bulkUpdateStock(selectedIds, 'set', parsedStockValue);
      } else {
        const groups = {};
        for (const id of selectedIds) {
          const item = items.find(p => normalizeId(p.id || p.productId) === normalizeId(id));
          const currentStock = parseInt(item.stock, 10);
          const nextStock = calculateStock(currentStock, stockAction, parsedStockValue);

          if (isNaN(nextStock) || nextStock < 0) {
            const errorMsg = `Hesaplanan yeni stok değeri geçersiz: ${nextStock} (Ürün ID: ${id})`;
            await logToBackend({
              level: 'Error',
              message: errorMsg,
              metadata: { productId: id, currentStock, stockAction, parsedStockValue }
            });
            throw new Error(errorMsg);
          }

          if (!groups[nextStock]) {
            groups[nextStock] = [];
          }
          groups[nextStock].push(id);
        }

        await Promise.all(
          Object.entries(groups).map(([newStock, ids]) =>
            productsApi.bulkUpdateStock(ids, 'set', Number(newStock))
          )
        );
      }

      toast('Toplu stok güncellemesi başarılı.', 'success');
      setActiveModal(null);
      onClearSelection();
      onSuccess();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || '';
      toast(`Stok güncellemesi durduruldu: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const parsedPriceValue = parseFloat(priceValue);
      if (isNaN(parsedPriceValue) || !isFinite(parsedPriceValue) || parsedPriceValue < 0) {
        const errorMsg = `Geçersiz fiyat değeri girildi: "${priceValue}". İşlem iptal edildi.`;
        await logToBackend({
          level: 'Warning',
          message: errorMsg,
          metadata: { priceValue, priceAction, selectedIds }
        });
        toast('Lütfen geçerli bir fiyat giriniz (0 veya pozitif sayı).', 'error');
        setLoading(false);
        return;
      }

      const items = await resolveAllProducts();

      // Tüm seçili ürünlerin mevcut fiyat verilerini kontrol et
      for (const item of items) {
        const pId = item.id || item.productId;
        const currentPrice = parseFloat(item.price);
        if (isNaN(currentPrice) || !isFinite(currentPrice) || currentPrice < 0) {
          const errorMsg = `Ürünün (${item.name || pId}) mevcut fiyat verisi geçersiz veya okunamadı: "${item.price}". Fiyatın sıfırlanmasını önlemek için işlem durduruldu.`;
          await logToBackend({
            level: 'Error',
            message: errorMsg,
            metadata: { productId: pId, currentPrice: item.price, priceAction }
          });
          throw new Error(errorMsg);
        }
      }

      if (priceAction === 'set') {
        const targetPrice = Math.round(parsedPriceValue * 100) / 100;
        await productsApi.bulkUpdatePrice(selectedIds, 'set', targetPrice);
      } else {
        const groups = {};
        for (const id of selectedIds) {
          const item = items.find(p => normalizeId(p.id || p.productId) === normalizeId(id));
          const currentPrice = parseFloat(item.price);
          const nextPrice = calculatePrice(currentPrice, priceAction, parsedPriceValue);

          if (isNaN(nextPrice) || !isFinite(nextPrice) || nextPrice < 0) {
            const errorMsg = `Hesaplanan yeni fiyat değeri geçersiz: ${nextPrice} (Ürün ID: ${id})`;
            await logToBackend({
              level: 'Error',
              message: errorMsg,
              metadata: { productId: id, currentPrice, priceAction, parsedPriceValue }
            });
            throw new Error(errorMsg);
          }

          if (!groups[nextPrice]) {
            groups[nextPrice] = [];
          }
          groups[nextPrice].push(id);
        }

        await Promise.all(
          Object.entries(groups).map(([newPrice, ids]) =>
            productsApi.bulkUpdatePrice(ids, 'set', Number(newPrice))
          )
        );
      }

      toast('Toplu fiyat güncellemesi başarılı.', 'success');
      setActiveModal(null);
      onClearSelection();
      onSuccess();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || '';
      toast(`Fiyat güncellemesi durduruldu: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const previewItems = resolvedProducts.length > 0 
    ? resolvedProducts 
    : (products || []).filter(p => selectedIds.some(id => normalizeId(id) === normalizeId(p.id || p.productId)));

  return (
    <>
      <div className="bulk-toolbar-wrapper">
        <div className="bulk-toolbar">
          <div className="bulk-info">
            <span className="selected-count">{selectedIds.length}</span> ürün seçildi
          </div>
          
          <div className="bulk-actions">
            <button className="btn-bulk btn-delete" onClick={handleBulkDelete} disabled={loading}>
              🗑️ Toplu Sil
            </button>
            <button className="btn-bulk btn-stock" onClick={() => setActiveModal('stock')} disabled={loading}>
              📦 Stok Güncelle
            </button>
            <button className="btn-bulk btn-price" onClick={() => setActiveModal('price')} disabled={loading}>
              🏷️ Fiyat Güncelle
            </button>
            <div className="divider"></div>
            <button className="btn-icon close-bulk" onClick={onClearSelection} title="Seçimi Temizle">
              ✖️
            </button>
          </div>
        </div>
      </div>

      {activeModal === 'stock' && (
        <div className="bulk-modal-overlay">
          <div className="bulk-modal-content">
            <h3>Toplu Stok Güncelle</h3>
            <p className="bulk-modal-desc">{selectedIds.length} ürün için stok işlemi uygulanacak.</p>
            <form onSubmit={handleBulkStockSubmit}>
              <div className="form-group">
                <label>İşlem Tipi</label>
                <select className="form-control" value={stockAction} onChange={e => setStockAction(e.target.value)}>
                  <option value="set">Sabit Bir Değere Ayarla (Set)</option>
                  <option value="increase">Stok Miktarına Ekle (+)</option>
                  <option value="decrease">Stok Miktarından Düş (-)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Değer (Adet)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required 
                  min="0" 
                  step="1"
                  value={stockValue} 
                  onChange={e => setStockValue(e.target.value)} 
                />
              </div>

              {/* Canlı Değişim Önizlemesi */}
              {previewItems.length > 0 && (
                <div className="bulk-preview-container">
                  <div className="bulk-preview-title">
                    <span>Değişim Önizlemesi</span>
                    <span className="bulk-preview-badge">{previewItems.length} Ürün</span>
                  </div>
                  <div className="bulk-preview-list">
                    {previewItems.slice(0, 4).map(item => {
                      const curVal = item.stock != null ? parseInt(item.stock, 10) : NaN;
                      const parsedInput = parseInt(stockValue, 10);
                      const isValid = !isNaN(curVal) && !isNaN(parsedInput) && parsedInput >= 0;
                      const nextVal = isValid ? calculateStock(curVal, stockAction, parsedInput) : curVal;
                      const diff = isValid ? (nextVal - curVal) : 0;

                      return (
                        <div key={item.id || item.productId} className="bulk-preview-item">
                          <span className="preview-item-name" title={item.name}>{item.name || `Ürün #${item.id || item.productId}`}</span>
                          <div className="preview-item-values">
                            {isNaN(curVal) ? (
                              <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Geçersiz Stok</span>
                            ) : (
                              <>
                                <span className="preview-current">{curVal}</span>
                                <span className="preview-arrow">➔</span>
                                <span className="preview-next">{nextVal}</span>
                                {diff !== 0 && (
                                  <span className={`preview-diff ${diff > 0 ? 'diff-plus' : 'diff-minus'}`}>
                                    ({diff > 0 ? `+${diff}` : diff})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {previewItems.length > 4 && (
                      <div className="bulk-preview-more">
                        +{previewItems.length - 4} ürün daha güncellenecek
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)} disabled={loading}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Uygulanıyor...' : 'Uygula'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'price' && (
        <div className="bulk-modal-overlay">
          <div className="bulk-modal-content">
            <h3>Toplu Fiyat Güncelle</h3>
            <p className="bulk-modal-desc">{selectedIds.length} ürün için fiyat işlemi uygulanacak.</p>
            <form onSubmit={handleBulkPriceSubmit}>
              <div className="form-group">
                <label>İşlem Tipi</label>
                <select className="form-control" value={priceAction} onChange={e => setPriceAction(e.target.value)}>
                  <option value="percent_decrease">Yüzdelik İndirim Yap (% Düşür)</option>
                  <option value="percent_increase">Yüzdelik Zam Yap (% Artır)</option>
                  <option value="fixed_decrease">Sabit Tutar Düş ($ Düşür)</option>
                  <option value="fixed_increase">Sabit Tutar Ekle ($ Artır)</option>
                  <option value="set">Sabit Bir Fiyata Ayarla ($ Yap)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Değer ({priceAction.includes('percent') ? '%' : '$'})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-control" 
                  required 
                  min="0" 
                  value={priceValue} 
                  onChange={e => setPriceValue(e.target.value)} 
                />
              </div>

              {/* Canlı Değişim Önizlemesi */}
              {previewItems.length > 0 && (
                <div className="bulk-preview-container">
                  <div className="bulk-preview-title">
                    <span>Değişim Önizlemesi</span>
                    <span className="bulk-preview-badge">{previewItems.length} Ürün</span>
                  </div>
                  <div className="bulk-preview-list">
                    {previewItems.slice(0, 4).map(item => {
                      const curVal = item.price != null ? parseFloat(item.price) : NaN;
                      const parsedInput = parseFloat(priceValue);
                      const isValid = !isNaN(curVal) && isFinite(curVal) && !isNaN(parsedInput) && isFinite(parsedInput) && parsedInput >= 0;
                      const nextVal = isValid ? calculatePrice(curVal, priceAction, parsedInput) : curVal;
                      const diff = isValid ? Number((nextVal - curVal).toFixed(2)) : 0;

                      return (
                        <div key={item.id || item.productId} className="bulk-preview-item">
                          <span className="preview-item-name" title={item.name}>{item.name || `Ürün #${item.id || item.productId}`}</span>
                          <div className="preview-item-values">
                            {isNaN(curVal) ? (
                              <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Geçersiz Fiyat</span>
                            ) : (
                              <>
                                <span className="preview-current">${curVal.toFixed(2)}</span>
                                <span className="preview-arrow">➔</span>
                                <span className="preview-next">${nextVal.toFixed(2)}</span>
                                {diff !== 0 && (
                                  <span className={`preview-diff ${diff > 0 ? 'diff-plus' : 'diff-minus'}`}>
                                    ({diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {previewItems.length > 4 && (
                      <div className="bulk-preview-more">
                        +{previewItems.length - 4} ürün daha güncellenecek
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)} disabled={loading}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Uygulanıyor...' : 'Uygula'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsToolbar;
