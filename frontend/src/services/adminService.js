import api from './api';

const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  changeUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/change-role`, { role });
    return response.data;
  },
};

export default adminService;
