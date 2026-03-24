const axios = require('axios');

/**
 * Alternative SMS Service using TextLocal API
 * No template approval required
 */
class AlternativeSMSService {
  constructor() {
    this.apiKey = process.env.TEXTLOCAL_API_KEY || 'your-textlocal-api-key';
    this.sender = process.env.TEXTLOCAL_SENDER || 'RENTYT';
    this.baseUrl = 'https://api.textlocal.in/send/';
  }

  /**
   * Send OTP via TextLocal API
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - SMS result
   */
  async sendOTP(phone, otp) {
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      // Simple OTP message
      const message = `Your RentYatra OTP is ${otp}. Valid for 10 minutes.`;
      
      const params = {
        apikey: this.apiKey,
        numbers: normalizedPhone,
        message: message,
        sender: this.sender
      };

      const response = await axios.post(this.baseUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      console.log('TextLocal Response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.batch_id,
          status: 'sent',
          to: normalizedPhone,
          body: message,
          provider: 'TextLocal',
          response: response.data
        };
      } else {
        throw new Error(`TextLocal error: ${response.data.errors[0].message}`);
      }

    } catch (error) {
      console.error('TextLocal SMS Error:', error.message);
      throw error;
    }
  }

  /**
   * Normalize phone number
   * @param {string} phone - Phone number
   * @returns {string} - Normalized phone number
   */
  normalizePhoneNumber(phone) {
    const digits = phone.replace(/[^0-9]/g, '');
    
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    
    if (digits.length === 10) {
      return '91' + digits;
    }
    
    if (digits.length === 11 && digits.startsWith('0')) {
      return '91' + digits.substring(1);
    }
    
    throw new Error(`Invalid phone number format: ${phone}`);
  }
}

module.exports = new AlternativeSMSService();
