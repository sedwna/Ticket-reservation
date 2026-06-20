import api from './api';

const uploadService = {
  uploadPoster: async (file) => {
    const formData = new FormData();
    formData.append('poster', file);
    const response = await api.post('/admin/upload/poster', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default uploadService;
