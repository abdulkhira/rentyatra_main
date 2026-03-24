import config from '../config/apiConfig';

class AdminPaymentService {
  async getAllPayments() {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('No admin token found. Please login again.');
      }

      const response = await fetch(`${config.API_BASE_URL}/admin/payments/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch payment details');
      }

      return data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }
}

export default new AdminPaymentService();
