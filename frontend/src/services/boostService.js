class BoostService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 
      (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
    this.baseURL += '/boost';
  }

  // Create a new boost order
  async createBoostOrder(rentalRequestId, boostType) {
    try {
      const response = await fetch(`${this.baseURL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rentalRequestId,
          boostType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create boost order');
      }

      return data;
    } catch (error) {
      console.error('Error creating boost order:', error);
      throw error;
    }
  }

  // Get user's boost orders
  async getUserBoosts(status = null, page = 1, limit = 10) {
    try {
      let url = `${this.baseURL}/user?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boost orders');
      }

      // Return data array directly if it exists, otherwise return the full response
      if (data.success && data.data) {
        return data.data; // Return just the array of boosts
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user boosts:', error);
      throw error;
    }
  }

  // Get boost statistics
  async getBoostStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boost statistics');
      }

      return data;
    } catch (error) {
      console.error('Error fetching boost stats:', error);
      throw error;
    }
  }

  // Get active boosts for a rental request
  async getRentalRequestBoosts(rentalRequestId) {
    try {
      const response = await fetch(`${this.baseURL}/rental/${rentalRequestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boosts');
      }

      return data;
    } catch (error) {
      console.error('Error fetching rental request boosts:', error);
      throw error;
    }
  }

  // Update boost payment status
  async updateBoostPayment(boostId, paymentStatus, paymentDetails = null) {
    try {
      const response = await fetch(`${this.baseURL}/${boostId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentStatus,
          paymentDetails
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update boost payment');
      }

      return data;
    } catch (error) {
      console.error('Error updating boost payment:', error);
      throw error;
    }
  }

  // Cancel boost order
  async cancelBoostOrder(boostId) {
    try {
      const response = await fetch(`${this.baseURL}/${boostId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel boost order');
      }

      return data;
    } catch (error) {
      console.error('Error cancelling boost order:', error);
      throw error;
    }
  }

  // Get boost packages from backend
  async getBoostPackages() {
    try {
      const response = await fetch(`${this.baseURL}/packages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boost packages');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching boost packages:', error);
      // Fallback to default packages if API fails
      return this.getDefaultPackages();
    }
  }

  // Sync boost usage between systems
  async syncBoostUsage() {
    try {
      const response = await fetch(`${this.baseURL}/sync-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync boost usage');
      }

      return data;
    } catch (error) {
      console.error('Error syncing boost usage:', error);
      throw error;
    }
  }

  // Fallback default packages
  getDefaultPackages() {
    return [
      {
        id: 'boost-1',
        name: 'Quick Boost',
        price: 99,
        duration: '1 month',
        durationHours: 720,
        features: [
          'Top placement in search results',
          'Increased visibility',
          'Priority in category listings',
          'Email notifications',
          '4 boosts included'
        ],
        icon: 'Zap',
        color: 'yellow',
        popular: false,
        boostCount: 4
      },
      {
        id: 'boost-3',
        name: 'Power Boost',
        price: 249,
        duration: '1 month',
        durationHours: 720,
        features: [
          'Premium placement in search results',
          'Maximum visibility',
          'Featured in category listings',
          'Priority customer support',
          'Email notifications',
          '8 boosts included'
        ],
        icon: 'Rocket',
        color: 'orange',
        popular: true,
        boostCount: 8
      },
      {
        id: 'boost-7',
        name: 'Mega Boost',
        price: 499,
        duration: '1 month',
        durationHours: 720,
        features: [
          'Ultimate placement in search results',
          'Maximum visibility across platform',
          'Priority customer support',
          'Email notifications',
          '12 boosts included'
        ],
        icon: 'Crown',
        color: 'purple',
        popular: false,
        boostCount: 12
      }
    ];
  }
}

export default new BoostService();
