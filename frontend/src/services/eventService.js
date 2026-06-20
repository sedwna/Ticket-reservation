import api from './api';

const eventService = {
  getActiveEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getSeatMap: async (eventId) => {
    const response = await api.get(`/events/${eventId}/seats`);
    return response.data;
  },

  // Admin
  createEvent: async (data) => {
    const response = await api.post('/admin/events', data);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.put(`/admin/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/admin/events/${id}`);
    return response.data;
  },
};

export default eventService;
