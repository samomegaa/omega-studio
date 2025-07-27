import api from './api';

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
  getAvailableSlots: async (date, serviceType, duration) => {
    try {
      const response = await api.get('/bookings/available-slots', {
        params: { 
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          service_type: serviceType, 
          duration 
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },  // <-- ADD THIS COMMA

  // Get service packages
  getServicePackages: async (serviceType) => {
    try {
      const response = await api.get(`/bookings/packages/${serviceType}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};  // <-- This closing brace was in the wrong place

export default bookingService;
