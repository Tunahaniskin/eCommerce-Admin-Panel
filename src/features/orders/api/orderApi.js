import axiosInstance from '../../../shared/utils/axiosInstance';

export const orderApi = {
  getOrders: async (filters = {}) => {
    const response = await axiosInstance.get('/api/orders', { params: filters });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/api/orders/${orderId}`);
    return response.data;
  },

  refundOrder: async (orderId) => {
    const response = await axiosInstance.post(`/api/orders/${orderId}/refund`);
    return response.data;
  }
};
