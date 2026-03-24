import apiConfig from '../config/apiConfig';

// Plan management service - now uses backend API
class PlanService {
  constructor() {
    this.apiBaseUrl = apiConfig.API_BASE_URL;
  }

  // Helper method to transform backend plan to frontend format
  transformPlan(plan) {
    return {
      id: plan.planId,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: plan.features || [],
      maxListings: plan.maxListings,
      maxPhotos: plan.maxPhotos,
      gradient: plan.gradient,
      popular: plan.popular,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder
    };
  }

  // Helper method to transform frontend plan to backend format
  transformPlanForBackend(plan) {
    return {
      planId: plan.id || plan.planId,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: plan.features || [],
      maxListings: plan.maxListings,
      maxPhotos: plan.maxPhotos,
      gradient: plan.gradient,
      popular: plan.popular,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      displayOrder: plan.displayOrder || 0
    };
  }

  // Get all plans from backend
  async getAllPlans() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription-plans?activeOnly=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform backend plans to frontend format
        return data.data.map(plan => this.transformPlan(plan));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching plans from backend:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  // Get plan by ID from backend
  async getPlanById(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription-plans/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch plan: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return this.transformPlan(data.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching plan from backend:', error);
      return null;
    }
  }

  // Update plan in backend
  async updatePlan(planId, updatedPlan) {
    try {
      const planData = this.transformPlanForBackend({
        ...updatedPlan,
        id: planId
      });

      const response = await fetch(`${this.apiBaseUrl}/subscription-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update plan: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return this.transformPlan(data.data);
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error updating plan in backend:', error);
      throw error;
    }
  }

  // Create new plan in backend
  async createPlan(newPlan) {
    try {
      const planData = this.transformPlanForBackend(newPlan);

      // Ensure planId is set
      if (!planData.planId) {
        planData.planId = newPlan.id || `plan-${Date.now()}`;
      }

      const response = await fetch(`${this.apiBaseUrl}/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create plan: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return this.transformPlan(data.data);
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error creating plan in backend:', error);
      throw error;
    }
  }

  // Delete plan from backend
  async deletePlan(planId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete plan: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting plan from backend:', error);
      throw error;
    }
  }
}

// Create singleton instance
const planService = new PlanService();

export default planService;
