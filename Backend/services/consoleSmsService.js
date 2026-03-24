/**
 * Console SMS Service - For Development
 * Logs OTP to console when SMS service is not available
 */
class ConsoleSMSService {
  constructor() {
    this.serviceName = 'Console SMS (Development)';
  }

  /**
   * Send OTP to console (development mode)
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - SMS result
   */
  async sendOTP(phone, otp) {
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      // Log OTP to console
      console.log('\n' + '='.repeat(60));
      console.log('📱 SMS OTP SENT (Development Mode)');
      console.log('='.repeat(60));
      console.log(`📞 Phone: ${normalizedPhone}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log(`💬 Message: Your RentYatra OTP is ${otp}. Valid for 10 minutes.`);
      console.log('='.repeat(60));
      console.log('ℹ️  In production, this OTP would be sent via SMS');
      console.log('='.repeat(60) + '\n');

      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        messageId: `console_${Date.now()}`,
        status: 'sent',
        to: normalizedPhone,
        body: `Your RentYatra OTP is ${otp}. Valid for 10 minutes.`,
        provider: this.serviceName,
        response: 'OTP logged to console for development'
      };

    } catch (error) {
      console.error('Console SMS Error:', error.message);
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

  /**
   * Test connection
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    return {
      success: true,
      message: 'Console SMS service is ready for development',
      provider: this.serviceName
    };
  }
}

module.exports = new ConsoleSMSService();
