import axiosInstance from '../../../shared/utils/axiosInstance';

export const profileApi = {
  getProfile: async () => {
    // Profil getirme endpoint'i
    // JWT içindeki claimlerden (Id) bulacak backend
    const response = await axiosInstance.get('/api/admin/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    // Kişisel bilgileri güncelleme
    const response = await axiosInstance.put('/api/admin/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    // { currentPassword, newPassword }
    const response = await axiosInstance.post('/api/admin/profile/change-password', passwordData);
    return response.data;
  }
};
