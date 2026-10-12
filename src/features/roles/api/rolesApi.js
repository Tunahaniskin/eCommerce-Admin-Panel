import axiosInstance from '../../../shared/utils/axiosInstance';

export const rolesApi = {
  getRoles: async () => {
    const response = await axiosInstance.get('/api/admin/roles');
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await axiosInstance.get(`/api/admin/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
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
