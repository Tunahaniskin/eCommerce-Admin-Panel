import axiosInstance from '../../../shared/utils/axiosInstance';

export const productsApi = {
  getProducts: async (params = {}) => {
    // params can include: page, pageSize, search, categoryId, stockStatus, minPrice, maxPrice, status, sortBy, sortOrder
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        query.append(key, params[key]);
      }
    });
    const response = await axiosInstance.get(`/api/products?${query.toString()}`);
    return response.data;
  },
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/api/products/${id}`);
    return response.data;
  },
  createProduct: async (productData, files = []) => {
    const formData = new FormData();
    // JSON verilerini form-data'ya ekle
    Object.keys(productData).forEach(key => {
      formData.append(key, productData[key]);
    });
    // Resimleri form-data'ya ekle
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    const response = await axiosInstance.post('/api/admin/products', formData);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await axiosInstance.delete(`/api/admin/products/${id}`);
    return response.data;
  },
  updateProduct: async (id, productData) => {
    const response = await axiosInstance.put(`/api/admin/products/${id}`, productData);
    return response.data;
  },
  
  // Image Operations
  uploadImages: async (id, files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    const response = await axiosInstance.post(`/api/admin/products/${id}/images`, formData);
    return response.data;
  },
  deleteImage: async (productId, imageId) => {
    const response = await axiosInstance.delete(`/api/admin/products/images/${imageId}`);
    return response.data;
  },
  setMainImage: async (productId, imageId) => {
    const response = await axiosInstance.put(`/api/admin/products/${productId}/images/${imageId}/main`);
    return response.data;
  },

  // Bulk Operations
  bulkDelete: async (productIds) => {
    const response = await axiosInstance.post('/api/admin/products/bulk-delete', { productIds });
    return response.data;
  },
  bulkUpdateStock: async (productIds, action, newStock) => {
    const num = parseInt(newStock, 10);
    if (isNaN(num) || num < 0) {
      throw new Error(`Geçersiz stok değeri: "${newStock}". Varsayılan 0 ataması yapılmayıp işlem durduruldu.`);
    }
    const response = await axiosInstance.post('/api/admin/products/bulk-update-stock', { 
      productIds, 
      action,
      value: num,
      newStock: num 
    });
    return response.data;
  },
  bulkUpdatePrice: async (productIds, action, newPrice) => {
    const num = parseFloat(newPrice);
    if (isNaN(num) || !isFinite(num) || num < 0) {
      throw new Error(`Geçersiz fiyat değeri: "${newPrice}". Varsayılan 0 ataması yapılmayıp işlem durduruldu.`);
    }
    const response = await axiosInstance.post('/api/admin/products/bulk-update-price', { 
      productIds,
      action,
      value: num,
      newPrice: num 
    });
    return response.data;
  }
};
