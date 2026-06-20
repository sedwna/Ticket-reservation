import api from './api';

const reservationService = {
  create: async (eventId, seatId) => {
    const response = await api.post('/reservations', {
      event_id: eventId,
      seat_id: seatId,
    });
    return response.data;
  },

  getMyReservations: async (tab = 'active') => {
    const response = await api.get('/reservations/my', { params: { tab } });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/reservations/${id}`);
    return response.data;
  },

  // Admin
  getAll: async (filters = {}) => {
    const response = await api.get('/admin/reservations', { params: filters });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/reports/stats');
    return response.data;
  },

  getEventReport: async (eventId) => {
    const response = await api.get(`/admin/reports/events/${eventId}`);
    return response.data;
  },

  getOccupancyData: async () => {
    const response = await api.get('/admin/reports/occupancy');
    return response.data;
  },

  exportCSV: async (filters = {}) => {
    const response = await api.get('/admin/reports/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reservationService;
