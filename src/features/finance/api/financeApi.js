import axiosInstance from '../../../shared/utils/axiosInstance';

export const financeApi = {
  getDepositTickets: async () => {
    const response = await axiosInstance.get('/api/admin/finance/deposit-requests');
    return response.data;
  },

  approveTicket: async (ticketId) => {
    const response = await axiosInstance.post(`/api/admin/finance/deposit-requests/${ticketId}/approve`);
    return response.data;
  },

  rejectTicket: async (ticketId, reason) => {
    const response = await axiosInstance.post(`/api/admin/finance/deposit-requests/${ticketId}/reject`, { reason });
    return response.data;
  }
};
