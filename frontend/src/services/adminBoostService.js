// Admin boost management service
class AdminBoostService {
  constructor() {
    this.baseURL = '/api/admin/boost-packages';
  }

  // Get all boost packages
  async getAllBoostPackages() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boost packages');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching boost packages:', error);
      throw error;
    }
  }

  // Get boost package by ID
  async getBoostPackageById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boost package');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching boost package:', error);
      throw error;
    }
  }

  // Create new boost package
  async createBoostPackage(packageData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(packageData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create boost package');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating boost package:', error);
      throw error;
    }
  }

  // Update boost package
  async updateBoostPackage(id, packageData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(packageData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update boost package');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating boost package:', error);
      throw error;
    }
  }

  // Delete boost package
  async deleteBoostPackage(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete boost package');
      }

      return data;
    } catch (error) {
      console.error('Error deleting boost package:', error);
      throw error;
    }
  }

  // Get user boosts (admin view)
  async getUserBoosts() {
    try {
      const response = await fetch(`${this.baseURL}/user-boosts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user boosts');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching user boosts:', error);
      throw error;
    }
  }

  // Delete boost order
  async deleteBoostOrder(id) {
    try {
      const response = await fetch(`${this.baseURL}/user-boosts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete boost order');
      }

      return data;
    } catch (error) {
      console.error('Error deleting boost order:', error);
      throw error;
    }
  }

  // Update boost order
  async updateBoostOrder(id, orderData) {
    try {
      const response = await fetch(`${this.baseURL}/user-boosts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update boost order');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating boost order:', error);
      throw error;
    }
  }
}

export default new AdminBoostService();
