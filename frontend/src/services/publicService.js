import api from './api';

const publicService = {
  getStats: async () => {
    const response = await api.get('/public/stats');
    return response.data;
  },
};

export default publicService;
