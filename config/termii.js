const axios = require('axios');

class TermiiService {
  constructor() {
    this.apiKey = process.env.TERMII_API_KEY;
    this.senderId = process.env.TERMII_SENDER_ID || 'OmegaStudio';
    this.baseURL = 'https://api.ng.termii.com/api';
  }

  // Format Nigerian phone number
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if not present
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    return cleaned;
  }

  // Send SMS
  async sendSMS(to, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const payload = {
        api_key: this.apiKey,
        to: formattedPhone,
        from: this.senderId,
        sms: message,
        type: 'plain',
        channel: 'generic'
      };

      const response = await axios.post(`${this.baseURL}/sms/send`, payload);
      
      if (response.data.code === 'ok') {
        console.log(`SMS sent successfully to ${formattedPhone}`);
        return { success: true, messageId: response.data.message_id };
      } else {
        console.error('Termii SMS error:', response.data);
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Send OTP (if needed for verification)
  async sendOTP(to, otp) {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const payload = {
        api_key: this.apiKey,
        message_type: 'NUMERIC',
        to: formattedPhone,
        from: this.senderId,
        channel: 'generic',
        pin_attempts: 3,
        pin_time_to_live: 10,
        pin_length: 6,
        pin_placeholder: '< OTP >',
        message_text: `Your Omega Studio verification code is < OTP >. Valid for 10 minutes.`,
        pin_type: 'NUMERIC'
      };

      const response = await axios.post(`${this.baseURL}/sms/otp/send`, payload);
      
      return {
        success: response.data.status === 200,
        pinId: response.data.pinId
      };
    } catch (error) {
      console.error('OTP sending error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Check balance
  async getBalance() {
    try {
      const response = await axios.get(`${this.baseURL}/get-balance`, {
        params: { api_key: this.apiKey }
      });
      
      return response.data;
    } catch (error) {
      console.error('Balance check error:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new TermiiService();
