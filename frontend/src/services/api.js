// API Base URL - with fallback for development and production
const DEFAULT_PROD_API = 'https://api.rentyatra.com/api';
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : DEFAULT_PROD_API);

// API Service Class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.refreshTokenValue = localStorage.getItem('refreshToken');
    this.adminToken = localStorage.getItem('adminToken');
    this.timeout = 90000; // 90 seconds timeout for file uploads
    this.isDev = import.meta.env.DEV;
  }

  // Conditional logging for development only
  log(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  logError(...args) {
    if (this.isDev) {
      console.error(...args);
    }
  }

  // Set authentication token
  setToken(token) {
    console.log('💾 apiService.setToken called:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage');
      // Verify storage
      const stored = localStorage.getItem('token');
      console.log('✅ Token storage verification:', {
        stored: !!stored,
        matches: stored === token,
        length: stored?.length || 0
      });
    } else {
      localStorage.removeItem('token');
      console.log('🗑️ Token removed from localStorage');
    }
  }

  setRefreshToken(refreshToken) {
    console.log('💾 apiService.setRefreshToken called:', {
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null'
    });
    this.refreshTokenValue = refreshToken;
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      console.log('✅ RefreshToken stored in localStorage');
      // Verify storage
      const stored = localStorage.getItem('refreshToken');
      console.log('✅ RefreshToken storage verification:', {
        stored: !!stored,
        matches: stored === refreshToken,
        length: stored?.length || 0
      });
    } else {
      localStorage.removeItem('refreshToken');
      console.log('🗑️ RefreshToken removed from localStorage');
    }
  }

  // Refresh token from localStorage
  refreshToken() {
    const token = localStorage.getItem('token');
    this.token = token;
    return token;
  }

  // Set admin authentication token
  setAdminToken(token) {
    this.adminToken = token;
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
  }

  // Timeout utility for fetch requests
  async fetchWithTimeout(url, options, timeoutMs = this.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request Timeout');
      }
      throw error;
    }
  }

  // Get authentication headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (!includeAuth) {
      return headers;
    }
    // Get fresh token from localStorage
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token);
    console.log('🔑 Token from instance:', this.token);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set:', headers.Authorization);
    } else {
      console.warn('⚠️ No token found in localStorage');
    }

    return headers;
  }

  // Get headers for file upload
  getFileUploadHeaders() {
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Get admin authentication headers
  getAdminHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Get fresh admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    console.log('🔐 Admin token from localStorage:', adminToken ? 'Found' : 'Not found');
    console.log('🔐 Admin token value:', adminToken);

    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
      console.log('🔐 Admin headers with token:', headers);
    } else {
      console.warn('⚠️ No admin token found in localStorage');
    }

    return headers;
  }

  // Get admin headers for file upload
  getAdminFileUploadHeaders() {
    const headers = {};

    // Get fresh admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    } else {
      console.warn('No admin token found for file upload');
    }

    console.log('Admin file upload headers:', headers);
    return headers;
  }

  // Helper to get refresh token from mobile app storage
  async getRefreshTokenFromMobileApp() {
    try {
      if (typeof window !== 'undefined' && window.flutter_inappwebview?.callHandler) {
        const response = await window.flutter_inappwebview.callHandler('getStoredAuthSession');
        if (response && typeof response === 'object' && response.refreshToken) {
          return response.refreshToken;
        }
      }
    } catch (error) {
      console.error('Failed to get refresh token from mobile app:', error);
    }
    return null;
  }

  // Generic request method
  async request(endpoint, options = {}, retryOn401 = true) {
    const url = `${this.baseURL}${endpoint}`;

    // Determine if endpoint requires authentication
    const normalizedEndpoint = endpoint.split('?')[0];
    const publicAuthEndpoints = [
      '/auth/send-otp',
      '/auth/verify-otp',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout', // Logout should work even without token
    ];

    const isPublicAuthEndpoint = publicAuthEndpoints.some(path =>
      normalizedEndpoint.startsWith(path)
    );

    const isPublicEndpoint = isPublicAuthEndpoint ||
      endpoint.includes('/public') ||
      endpoint.includes('/health') ||
      endpoint.includes('/admin/login') ||
      endpoint.includes('/admin/signup');

    const requiresAuth = !isPublicEndpoint;

    // Get token check before making request
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('Not authorized, no token');
        error.code = 'NO_TOKEN';
        throw error;
      }
    }
    const baseHeaders = this.getHeaders(requiresAuth);
    const config = {
      ...options,
      headers: {
        ...baseHeaders,
        ...(options.headers || {}),
      },
    };

    console.log('🌐 Making API request to:', url);
    console.log('📋 Request config:', config);

    try {
      const response = await fetch(url, config);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData;

        try {
          errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          console.warn('Could not parse error response as JSON');
        }

        if (response.status === 401 && requiresAuth && retryOn401) {
          console.warn('⚠️ 401 Unauthorized - Attempting to refresh token...');

          // Try to refresh token and retry the request
          let refreshToken = localStorage.getItem('refreshToken');

          // If refresh token is missing, try to get from mobile app storage
          if (!refreshToken) {
            console.log('🔄 Refresh token missing from localStorage, trying mobile app storage...');
            refreshToken = await this.getRefreshTokenFromMobileApp();
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
              this.setRefreshToken(refreshToken);
            }
          }

          if (refreshToken) {
            try {
              const refreshResponse = await this.refreshAuthToken(refreshToken);
              if (refreshResponse?.success) {
                const newToken = refreshResponse.data.token;
                const newRefreshToken = refreshResponse.data.refreshToken || refreshToken;

                // Update tokens
                if (newToken) {
                  this.setToken(newToken);
                }
                if (newRefreshToken) {
                  this.setRefreshToken(newRefreshToken);
                }

                // Retry the original request with new token
                console.log('🔄 Retrying original request with refreshed token...');
                const retryHeaders = this.getHeaders(requiresAuth);
                const retryConfig = {
                  ...options,
                  headers: {
                    ...retryHeaders,
                    ...(options.headers || {}),
                  },
                };

                const retryResponse = await fetch(url, retryConfig);

                if (!retryResponse.ok) {
                  let retryErrorMessage = `HTTP ${retryResponse.status}: ${retryResponse.statusText}`;
                  try {
                    const retryErrorData = await retryResponse.json();
                    if (retryErrorData && retryErrorData.message) {
                      retryErrorMessage = retryErrorData.message;
                    }
                  } catch (jsonError) {
                    console.warn('Could not parse retry error response as JSON');
                  }

                  const retryError = new Error(retryErrorMessage);
                  retryError.status = retryResponse.status;
                  if (retryResponse.status === 401) {
                    retryError.code = 'AUTH_EXPIRED';
                  }
                  throw retryError;
                }

                // Check if retry response is JSON
                const retryContentType = retryResponse.headers.get('content-type');
                if (!retryContentType || !retryContentType.includes('application/json')) {
                  const retryText = await retryResponse.text();
                  throw new Error(`Server returned non-JSON response after token refresh`);
                }

                const retryData = await retryResponse.json();
                console.log('✅ API Response (after refresh):', retryData);
                return retryData;
              }
            } catch (refreshError) {
              console.error('❌ Failed to refresh token:', refreshError);
              // Fall through to throw original 401 error
            }
          }

          // If refresh failed or no refresh token available, throw original error
          errorMessage = errorMessage || 'Session expired. Please login again.';
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = errorData;
        if (response.status === 401) {
          error.code = 'AUTH_EXPIRED';
        }
        throw error;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Non-JSON Response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          url: url,
          preview: responseText.substring(0, 200)
        });

        // Check if it's an HTML error page (usually means route not found or server down)
        if (responseText.includes('<!doctype html>') || responseText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. This usually means:
1. Backend server is not running
2. API endpoint does not exist (404)
3. Wrong API URL configured
          
Please check:
- Backend server is running on ${this.baseURL}
- API endpoint: ${endpoint}
- Network tab for actual request/response`);
        }

        throw new Error(`Server returned non-JSON response (${contentType || 'unknown type'}). Please check if backend is running and API endpoint is correct.`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ API Request Error:', error);

      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const networkError = new Error('Network error: Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
        networkError.originalError = error;
        throw networkError;
      }

      // If error already has a message, preserve it
      if (error.message && !error.message.includes('Network error')) {
        throw error;
      }

      throw error;
    }
  }

  // File upload request method
  async uploadFile(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      headers: this.getFileUploadHeaders(),
      body: formData,
    };

    try {
      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('File Upload Error:', error);

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Upload timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  // Authentication APIs
  async sendOTP(phone, context = 'login') {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, context }),
    });
  }

  async verifyOTP(phone, otp, name, email) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(phone, otp) {
    console.log('🌐 API LOGIN REQUEST:', { phone, otpLength: otp?.length });
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    // CRITICAL: Print backend response to verify tokens
    console.log('📥 API LOGIN RESPONSE RECEIVED:', {
      success: response.success,
      hasData: !!response.data,
      hasToken: !!response.data?.token,
      hasRefreshToken: !!response.data?.refreshToken,
      hasUser: !!response.data?.user,
      tokenPreview: response.data?.token ? response.data.token.substring(0, 30) + '...' : 'MISSING',
      refreshTokenPreview: response.data?.refreshToken ? response.data.refreshToken.substring(0, 30) + '...' : 'MISSING',
      refreshTokenExpiresAt: response.data?.refreshTokenExpiresAt,
      fullResponse: response
    });

    return response;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    const payload = refreshToken ? { refreshToken } : {};

    try {
      return await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } finally {
      this.setRefreshToken(null);
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async refreshAuthToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // User APIs
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(userData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }


  async getUserStats() {
    return this.request('/users/stats');
  }

  async updateUserPreferences(preferences) {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePhoneNumber(newPhone, otp) {
    return this.request('/users/change-phone', {
      method: 'POST',
      body: JSON.stringify({ newPhone, otp }),
    });
  }

  async deactivateAccount() {
    return this.request('/users/deactivate', {
      method: 'PUT',
    });
  }

  async reactivateAccount() {
    return this.request('/users/reactivate', {
      method: 'PUT',
    });
  }

  async getUserActivity(page = 1, limit = 10) {
    return this.request(`/users/activity?page=${page}&limit=${limit}`);
  }

  async exportUserData() {
    return this.request('/users/export');
  }

  // Document APIs
  async uploadAadharCard(aadharNumber, frontImage, backImage) {
    const formData = new FormData();
    if (aadharNumber) {
      formData.append('aadharNumber', aadharNumber);
    }
    formData.append('images', frontImage);
    formData.append('images', backImage);

    return this.uploadFile('/documents/upload-aadhar', formData);
  }

  async uploadPANCard(panNumber, frontImage, backImage) {
    const formData = new FormData();
    formData.append('panNumber', panNumber);
    formData.append('images', frontImage);
    formData.append('images', backImage);

    return this.uploadFile('/documents/upload-pan', formData);
  }

  async uploadProfileImage(image) {
    const formData = new FormData();
    formData.append('image', image);

    return this.uploadFile('/documents/upload-profile', formData);
  }

  async getDocumentStatus() {
    return this.request('/documents/status');
  }

  async getUserDocuments() {
    return this.request('/documents/status');
  }

  async deleteDocument(type) {
    return this.request(`/documents/delete/${type}`, {
      method: 'DELETE',
    });
  }

  // Admin APIs
  async adminLogin(email, password, adminKey = null) {
    const body = { email, password };
    if (adminKey) {
      body.adminKey = adminKey;
    }
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async adminSignup(adminData) {
    return this.request('/admin/signup', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  async getAdminProfile() {
    const url = `${this.baseURL}/admin/me`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateAdminProfile(adminData) {
    const url = `${this.baseURL}/admin/profile`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(adminData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async uploadAdminProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const url = `${this.baseURL}/admin/upload-profile-image`;
    const config = {
      method: 'POST',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Uploading admin profile image to:', url);
      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Admin Profile Image Upload Error:', error);

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Upload timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  async changeAdminPassword(currentPassword, newPassword, confirmPassword) {
    const url = `${this.baseURL}/admin/change-password`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return data;
    } catch (error) {
      console.error('Change Admin Password Error:', error);
      throw error;
    }
  }

  async getAdminStats() {
    const url = `${this.baseURL}/admin/stats`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 10, search = '') {
    const url = `${this.baseURL}/admin/users?page=${page}&limit=${limit}&search=${search}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getUserDetails(userId) {
    const url = `${this.baseURL}/admin/users/${userId}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateUserStatus(userId, status) {
    const url = `${this.baseURL}/admin/users/${userId}/status`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ status }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    const url = `${this.baseURL}/admin/users/${userId}`;
    const config = {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Product APIs
  async addProduct(productData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(productData).forEach(key => {
      if (key === 'images') {
        // Handle images separately
        productData[key].forEach(image => {
          formData.append('images', image);
        });
      } else {
        formData.append(key, productData[key]);
      }
    });

    const url = `${this.baseURL}/admin/products`;
    const config = {
      method: 'POST',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Making request to:', url);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('File Upload Error Details:', {
        error: error,
        message: error.message,
        stack: error.stack
      });

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Upload timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  async getAllProducts(page = 1, limit = 10, status = '', search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const url = `${this.baseURL}/admin/products?${params.toString()}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getProduct(productId) {
    const url = `${this.baseURL}/admin/products/${productId}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(productData).forEach(key => {
      if (key === 'images') {
        // Handle images separately
        productData[key].forEach(image => {
          formData.append('images', image);
        });
      } else {
        formData.append(key, productData[key]);
      }
    });

    const url = `${this.baseURL}/admin/products/${productId}`;
    const config = {
      method: 'PUT',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Updating product:', productId);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      console.log('Update response status:', response.status);

      const data = await response.json();
      console.log('Update response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Update Product Error:', error);

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Update timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  async updateProductStatus(productId, status) {
    const url = `${this.baseURL}/admin/products/${productId}/status`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ status }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    const url = `${this.baseURL}/admin/products/${productId}`;
    const config = {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getProductStats() {
    const url = `${this.baseURL}/admin/products/stats`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Category APIs
  async addCategory(categoryData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(categoryData).forEach(key => {
      if (key === 'images') {
        // Handle images separately
        categoryData[key].forEach(image => {
          formData.append('images', image);
        });
      } else {
        formData.append(key, categoryData[key]);
      }
    });

    const url = `${this.baseURL}/admin/categories`;
    const config = {
      method: 'POST',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Adding category:', categoryData);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(url, config);
      console.log('Add category response status:', response.status);
      console.log('Add category response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Add category response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const textResponse = await response.text();
        console.log('Raw response text:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Add Category Error Details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        url: url,
        config: config
      });
      throw error;
    }
  }

  async getAllCategories(page = 1, limit = 100, status = '', search = '', productId = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (productId) params.append('productId', productId);

    const url = `${this.baseURL}/admin/categories?${params.toString()}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getCategory(categoryId) {
    const url = `${this.baseURL}/admin/categories/${categoryId}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateCategory(categoryId, categoryData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(categoryData).forEach(key => {
      if (key === 'images') {
        // Handle images separately
        categoryData[key].forEach(image => {
          formData.append('images', image);
        });
      } else {
        formData.append(key, categoryData[key]);
      }
    });

    const url = `${this.baseURL}/admin/categories/${categoryId}`;
    const config = {
      method: 'PUT',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Updating category:', categoryId, categoryData);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(url, config);
      console.log('Update category response status:', response.status);

      const data = await response.json();
      console.log('Update category response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Update Category Error:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    const url = `${this.baseURL}/admin/categories/${categoryId}`;
    const config = {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateCategoryStatus(categoryId, status) {
    const url = `${this.baseURL}/admin/categories/${categoryId}/status`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ status }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getCategoryStats() {
    const url = `${this.baseURL}/admin/categories/stats`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Public Product APIs (for regular users)
  async getPublicProducts(page = 1, limit = 12, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);

    const url = `${this.baseURL}/products?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getPublicProduct(productId) {
    const url = `${this.baseURL}/products/${productId}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getFeaturedProducts(limit = 8, city = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (city) {
      params.append('city', city);
    }

    const url = `${this.baseURL}/products/featured?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log('🌐 Fetching featured products from:', url);

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // Handle database unavailable errors gracefully
        if (response.status === 503 && (data.message?.includes('Database service unavailable') || response.statusText.includes('Service Unavailable'))) {
          console.warn('⚠️ Database temporarily unavailable, returning empty products');
          return {
            success: true,
            data: { products: [] }
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Featured products response:', data);
      return data;
    } catch (error) {
      // Only log non-database errors
      if (!error.message?.includes('Database service unavailable') && !error.message?.includes('Service Unavailable')) {
        console.error('❌ Error fetching featured products:', error);
      }
      // For database unavailable, return empty data
      if (error.message?.includes('Database service unavailable') || error.message?.includes('Service Unavailable')) {
        return {
          success: true,
          data: { products: [] }
        };
      }
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Public Category APIs (for regular users)
  async getPublicCategories(page = 1, limit = 50, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);

    const url = `${this.baseURL}/categories?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // Handle database unavailable errors gracefully
        if (response.status === 503 && (data.message?.includes('Database service unavailable') || response.statusText.includes('Service Unavailable'))) {
          console.warn('⚠️ Database temporarily unavailable, returning empty categories');
          return {
            success: true,
            data: { categories: [] }
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Only log non-database errors
      if (!error.message?.includes('Database service unavailable') && !error.message?.includes('Service Unavailable')) {
        console.error('API Request Error:', error);
      }
      // For database unavailable, return empty data
      if (error.message?.includes('Database service unavailable') || error.message?.includes('Service Unavailable')) {
        return {
          success: true,
          data: { categories: [] }
        };
      }
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  async getCategoriesByProduct(productId, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `${this.baseURL}/categories/product/${productId}?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getPublicCategory(categoryId) {
    const url = `${this.baseURL}/categories/${categoryId}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Banner APIs
  async addBanner(bannerData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(bannerData).forEach(key => {
      if (key === 'image') {
        // Handle image separately
        formData.append('image', bannerData[key]);
      } else {
        formData.append(key, bannerData[key]);
      }
    });

    const url = `${this.baseURL}/admin/banners`;
    const config = {
      method: 'POST',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Adding banner:', bannerData);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      console.log('Add banner response status:', response.status);
      console.log('Add banner response headers:', response.headers);

      const data = await response.json();
      console.log('Add banner response data:', data);

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Add Banner Error Details:', {
        error: error,
        message: error.message,
        stack: error.stack
      });

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Upload timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  async getAllBanners(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `${this.baseURL}/admin/banners?${params.toString()}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getBanner(bannerId) {
    const url = `${this.baseURL}/admin/banners/${bannerId}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateBanner(bannerId, bannerData) {
    const formData = new FormData();

    // Add form fields
    Object.keys(bannerData).forEach(key => {
      if (key === 'image') {
        // Handle image separately
        formData.append('image', bannerData[key]);
      } else {
        formData.append(key, bannerData[key]);
      }
    });

    const url = `${this.baseURL}/admin/banners/${bannerId}`;
    const config = {
      method: 'PUT',
      headers: this.getAdminFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Updating banner:', bannerId, bannerData);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await this.fetchWithTimeout(url, config, 120000); // 2 minutes for file uploads
      console.log('Update banner response status:', response.status);

      const data = await response.json();
      console.log('Update banner response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Update Banner Error:', error);

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Update timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }

      throw error;
    }
  }

  async deleteBanner(bannerId) {
    const url = `${this.baseURL}/admin/banners/${bannerId}`;
    const config = {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }


  // Public Banner APIs (for regular users - no authentication required)
  async getPublicBanners(position = 'top', limit = 10) {
    const params = new URLSearchParams({
      position: position,
      limit: limit.toString()
    });

    const url = `${this.baseURL}/admin/banners/public?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle database unavailable errors gracefully
        if (response.status === 503 && data.message?.includes('Database service unavailable')) {
          console.warn('⚠️ Database temporarily unavailable, returning empty banners');
          return {
            success: true,
            data: { banners: [] }
          };
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      // Only log non-database errors
      if (!error.message?.includes('Database service unavailable')) {
        console.error('API Request Error:', error);
      }
      // For database unavailable, return empty data
      if (error.message?.includes('Database service unavailable')) {
        return {
          success: true,
          data: { banners: [] }
        };
      }
      throw error;
    }
  }


  // Rental Request APIs
  async getAllRentalRequests(page = 1, limit = 10, status = '', search = '', category = '', city = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (city) params.append('city', city);

    const url = `${this.baseURL}/admin/rental-requests?${params.toString()}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getRentalRequest(requestId) {
    const url = `${this.baseURL}/admin/rental-requests/${requestId}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateRentalRequestStatus(requestId, status, rejectionReason = null) {
    const url = `${this.baseURL}/admin/rental-requests/${requestId}/status`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async bulkUpdateRentalRequestStatus(requestIds, status, rejectionReason = null) {
    const url = `${this.baseURL}/admin/rental-requests/bulk-status`;
    const config = {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ requestIds, status, rejectionReason }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async deleteRentalRequest(requestId) {
    const url = `${this.baseURL}/admin/rental-requests/${requestId}`;
    const config = {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getRentalRequestStats() {
    const url = `${this.baseURL}/admin/rental-requests/stats`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getRentalRequestsByUser(userId, page = 1, limit = 10, status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);

    const url = `${this.baseURL}/admin/rental-requests/user/${userId}?${params.toString()}`;
    const config = {
      headers: this.getAdminHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Public Rental Request APIs
  async getPublicRentalRequests(page = 1, limit = 12, search = '', category = '', city = '', userCoordinates = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (city) params.append('city', city);

    // Add location-based filtering if user coordinates are provided
    // This will filter products where user is within each product's serviceRadius
    if (userCoordinates && userCoordinates.lat && userCoordinates.lng) {
      params.append('userLat', userCoordinates.lat.toString());
      params.append('userLng', userCoordinates.lng.toString());
      console.log('🌐 Fetching public rental requests with location filtering (using each product\'s serviceRadius):', { userCoordinates });
    }

    const url = `${this.baseURL}/rental-requests?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getPublicRentalRequest(requestId, userId = null) {
    const url = `${this.baseURL}/rental-requests/${requestId}${userId ? `?userId=${userId}` : ''}`;
    console.log('Debug - API URL:', url);
    console.log('Debug - Request ID:', requestId);
    console.log('Debug - User ID:', userId);
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getFeaturedRentalRequests(limit = 8, city = '', userCoordinates = null, serviceRadius = 7) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (city) {
      params.append('city', city);
    }

    // Add location-based filtering if user coordinates are provided
    if (userCoordinates && userCoordinates.lat && userCoordinates.lng) {
      params.append('userLat', userCoordinates.lat.toString());
      params.append('userLng', userCoordinates.lng.toString());
      params.append('serviceRadius', serviceRadius.toString());
      console.log('🌐 Fetching featured listings with location filtering:', { userCoordinates, serviceRadius });
    } else {
      console.log('🌐 Fetching featured listings without location filtering');
    }

    const url = `${this.baseURL}/rental-requests/featured?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log('🌐 Featured listings API URL:', url);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('✅ Featured listings response:', { status: response.status, data });

      if (!response.ok) {
        // Handle database unavailable errors gracefully
        if (response.status === 503 && data.message?.includes('Database service unavailable')) {
          console.warn('⚠️ Database temporarily unavailable, returning empty listings');
          return {
            success: true,
            data: { requests: [] }
          };
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      // Only log non-database errors
      if (!error.message?.includes('Database service unavailable')) {
        console.error('❌ Error fetching featured listings:', error);
      }
      // For database unavailable, return empty data
      if (error.message?.includes('Database service unavailable')) {
        return {
          success: true,
          data: { requests: [] }
        };
      }
      throw error;
    }
  }

  // Create rental listing (for users)
  async createRentalListing(formData) {
    const url = `${this.baseURL}/rental-requests`;
    const config = {
      method: 'POST',
      headers: this.getFileUploadHeaders(),
      body: formData,
    };

    try {
      console.log('Creating rental listing:', formData);
      console.log('Request config:', config);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await this.fetchWithTimeout(url, config, 90000); // 1.30 minutes for file uploads
      console.log('Create rental listing response status:', response.status);
      console.log('Create rental listing response headers:', response.headers);

      const data = await response.json();
      console.log('Create rental listing response data:', data);

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Create Rental Listing Error Details:', {
        error: error,
        message: error.message,
        stack: error.stack
      });

      // Provide more specific error messages
      if (error.message === 'Request Timeout') {
        throw new Error('Upload timeout - Please try again with smaller files or check your internet connection');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection');
      }
      throw error;
    }
  }

  // Get user's own rental requests
  async getUserRentalListings(page = 1, limit = 10, status = '') {
    // Refresh token from localStorage before making request
    this.refreshToken();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);

    const url = `${this.baseURL}/rental-requests/my-requests?${params.toString()}`;
    const config = {
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Don't clear token automatically - let API service handle refresh
          // User should only logout via explicit logout button
          // Throw error with clear message
          throw new Error(data.message || 'Authentication failed. Please login again.');
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Boost a rental listing
  async boostRental(rentalId) {
    const url = `${this.baseURL}/rental-requests/${rentalId}/boost`;
    const config = {
      method: 'POST',
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to boost rental');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Create boost payment order - DISABLED
  async createBoostPaymentOrder(orderData) {
    throw new Error('Boost payment functionality has been disabled');
  }

  // Verify boost payment - DISABLED
  async verifyBoostPayment(paymentData) {
    throw new Error('Boost payment functionality has been disabled');
  }

  // Update user's rental request
  async updateRentalRequest(rentalId, updateData) {
    const url = `${this.baseURL}/rental-requests/${rentalId}`;
    const config = {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Review APIs
  async getProductReviews(productId, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.rating) params.append('rating', options.rating);

    const url = `${this.baseURL}/reviews/product/${productId}?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getRentalRequestReviews(rentalRequestId, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.rating) params.append('rating', options.rating);

    const url = `${this.baseURL}/reviews/rental-request/${rentalRequestId}?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async createProductReview(productId, reviewData) {
    return this.request(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async createRentalRequestReview(rentalRequestId, reviewData) {
    return this.request(`/reviews/rental-request/${rentalRequestId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateReview(reviewId, reviewData) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async voteReview(reviewId, isHelpful) {
    return this.request(`/reviews/${reviewId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ isHelpful }),
    });
  }

  async removeVote(reviewId) {
    return this.request(`/reviews/${reviewId}/vote`, {
      method: 'DELETE',
    });
  }

  async getUserReviews(userId, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const url = `${this.baseURL}/reviews/user/${userId}?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async getProductReviewStats(productId) {
    const url = `${this.baseURL}/reviews/product/${productId}/stats`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Favorites APIs
  async getFavorites() {
    return this.request('/favorites');
  }

  async addToFavorites(itemId, itemType = 'rental-request') {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType }),
    });
  }

  async removeFromFavorites(itemId) {
    return this.request(`/favorites/${itemId}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(itemId, itemType = 'rental-request') {
    try {
      return await this.request('/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ itemId, itemType }),
      });
    } catch (error) {
      // Handle 404 or route not found errors gracefully for favorites
      if (error.message.includes('Route not found') || error.message.includes('404')) {
        return { success: false, message: 'Favorites API not available' };
      }
      throw error;
    }
  }

  async getFavoriteItems(page = 1, limit = 12, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);

      return await this.request(`/favorites/items?${params.toString()}`);
    } catch (error) {
      // Handle 404 or route not found errors gracefully for favorites
      if (error.message.includes('Route not found') || error.message.includes('404')) {
        return { success: false, message: 'Favorites API not available' };
      }
      throw error;
    }
  }

  // Search APIs
  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query });
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    const url = `${this.baseURL}/search/products?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      return data;
    } catch (error) {
      console.error('Search Error:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query) {
    const url = `${this.baseURL}/search/suggestions?q=${encodeURIComponent(query)}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get suggestions');
      }

      return data;
    } catch (error) {
      console.error('Suggestions Error:', error);
      throw error;
    }
  }

  async handleSearchRedirect(query, type = null) {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);

    const url = `${this.baseURL}/search/redirect?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search redirect failed');
      }

      return data;
    } catch (error) {
      console.error('Search Redirect Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // HTTP method shortcuts
  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Admin-specific request method for ticket operations
  async adminRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAdminHeaders(),
      ...options,
    };

    console.log('🌐 Making Admin API request to:', url);
    console.log('📋 Admin Request config:', config);

    try {
      const response = await fetch(url, config);

      console.log('📡 Admin Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.warn('Could not parse error response as JSON');
        }

        // Check if it's an authentication error
        if (response.status === 401 || response.status === 403) {
          console.warn('🔐 Authentication failed, admin token may be invalid or expired');
          // Don't throw the error, return a special response instead
          return {
            success: false,
            error: 'Authentication failed',
            message: errorMessage,
            requiresAuth: true
          };
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Admin API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Admin API Request Error:', error);
      // Return a structured error response instead of throwing
      return {
        success: false,
        error: error.message,
        requiresAuth: true
      };
    }
  }

  // Admin ticket operations
  async updateTicketStatus(ticketId, status) {
    return this.adminRequest(`/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async updateTicketAdminNotes(ticketId, adminNotes) {
    return this.adminRequest(`/tickets/${ticketId}/admin-notes`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes })
    });
  }

  // New comprehensive admin update endpoint
  async adminUpdateTicket(ticketId, updateData) {
    return this.adminRequest(`/tickets/${ticketId}/admin-update`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Add resolution notes specifically
  async addResolutionNotes(ticketId, resolutionNotes) {
    return this.adminRequest(`/tickets/${ticketId}/resolution-notes`, {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes })
    });
  }

  async getTickets(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    return this.adminRequest(`/tickets?${params.toString()}`);
  }

  async getTicket(ticketId) {
    return this.adminRequest(`/tickets/${ticketId}`);
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
