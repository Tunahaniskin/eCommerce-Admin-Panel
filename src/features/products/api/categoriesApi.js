import axiosInstance from '../../../shared/utils/axiosInstance';

export const categoriesApi = {
  getCategories: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        query.append(key, params[key]);
      }
    });
    const response = await axiosInstance.get(`/api/admin/categories?${query.toString()}`);
    return response.data;
  },
  createCategory: async (categoryData) => {
    const response = await axiosInstance.post('/api/admin/categories', categoryData);
    return response.data;
  },
  updateCategory: async (id, categoryData) => {
    const response = await axiosInstance.put(`/api/admin/categories/${id}`, categoryData);
    return response.data;
  },
  deleteCategory: async (id, targetCategoryId = null) => {
    const url = targetCategoryId 
      ? `/api/admin/categories/${id}?targetCategoryId=${targetCategoryId}`
      : `/api/admin/categories/${id}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  }
};
