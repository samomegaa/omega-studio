import api from '../api';
const bookingService = {
  // Create public booking
  createPublicBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings/public', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get available slots
  getAvailableSlots: async (date, studioId, duration) => {
    try {
      const response = await api.get('/bookings/available-slots', {
        params: { date, studio_id: studioId, duration }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default bookingService;
