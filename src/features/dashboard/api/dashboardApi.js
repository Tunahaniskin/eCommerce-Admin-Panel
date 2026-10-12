import axiosInstance from '../../../shared/utils/axiosInstance';

export const dashboardApi = {
  getMetrics: async () => {
    const response = await axiosInstance.get('/api/admin/dashboard/metrics');
    return response.data;
  }
};
