import axiosInstance from '../../../shared/utils/axiosInstance';

export const usersApi = {
  getUsers: async (includeDeleted = false) => {
    const response = await axiosInstance.get('/api/admin/users', { params: { includeDeleted } });
    return response.data;
  },
  getUserById: async (id) => {
    const response = await axiosInstance.get(`/api/admin/users/${id}`);
    return response.data;
  },
  getCustomer360: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/users/${userId}/customer-360`);
      return response.data;
    } catch (error) {
      // Mock Data if endpoint is not ready
      if (error.response?.status === 404 || error.message.includes('Network Error')) {
        return {
          profile: {
            id: userId,
            fullName: "Örnek Müşteri",
            email: "ornek@example.com",
            createdAt: new Date().toISOString(),
            isDeleted: false,
            roleName: "Customer"
          },
          stats: {
            currentBalance: 450.00,
            totalSpent: 3250.00,
            totalOrdersCount: 8,
            refundedOrdersCount: 1
          },
          addresses: [
            {
              id: "addr-1",
              title: "Ev Adresi",
              recipientName: "Örnek Müşteri",
              phoneNumber: "+90 555 123 45 67",
              city: "İstanbul",
              district: "Kadıköy",
              fullAddress: "Örnek Mah. Deneme Sok. No: 1 D: 2"
            }
          ],
          recentOrders: [
            {
              orderId: "ORD-2026-0042",
              orderDate: new Date().toISOString(),
              totalAmount: 1250.00,
              itemCount: 3,
              status: "Delivered"
            }
          ],
          walletTransactions: [
            {
              transactionId: "trx-1",
              type: "ManualAdjustmentAdd", 
              amount: 100.00,
              balanceAfter: 450.00,
              description: "Kargo gecikmesi telafi bakiyesi (Admin)",
              createdAt: new Date().toISOString(),
              createdByAdminEmail: "admin@example.com"
            }
          ]
        };
      }
      throw error;
    }
  },
  adjustWalletBalance: async (userId, { amount, actionType, reason }) => {
    const response = await axiosInstance.post(`/api/admin/users/${userId}/wallet-adjustment`, {
      amount: Number(amount),
      actionType,
      reason
    });
    return response.data;
  },
  createUser: async (userData) => {
    const response = await axiosInstance.post('/api/admin/users', userData);
    return response.data;
  },
  updateUserRole: async (userId, roleId) => {
    const response = await axiosInstance.put(`/api/admin/users/${userId}/role`, { roleId });
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
  restoreUser: async (userId) => {
    const response = await axiosInstance.post(`/api/admin/users/${userId}/restore`);
    return response.data;
  },
  grantTemporaryPermission: async (userId, permission, durationInHours) => {
    const response = await axiosInstance.post(`/api/admin/users/${userId}/permissions/temporary`, {
      permission,
      durationInHours
    });
    return response.data;
  },
  getRoles: async () => {
    const response = await axiosInstance.get('/api/admin/roles');
    return response.data;
  },
  getRoleById: async (id) => {
    const response = await axiosInstance.get(`/api/admin/roles/${id}`);
    return response.data;
  },
  createRole: async (roleData) => {
    // roleData: { name: string, description: string, permissions: string[] }
    const response = await axiosInstance.post('/api/admin/roles', roleData);
    return response.data;
  },
  updateRole: async (id, data) => {
    const response = await axiosInstance.put(`/api/admin/roles/${id}`, data);
    return response.data;
  },
  deleteRole: async (id) => {
    const response = await axiosInstance.delete(`/api/admin/roles/${id}`);
    return response.data;
  },
  getPermissions: async () => {
    const response = await axiosInstance.get('/api/admin/permissions');
    return response.data;
  }
};
