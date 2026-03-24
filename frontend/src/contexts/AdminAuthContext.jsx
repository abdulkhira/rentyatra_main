import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const enableAutoLogin = import.meta.env.VITE_ENABLE_ADMIN_AUTO_LOGIN === 'true';

  // Check for existing admin session on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminUser');
      
      if (token && adminData) {
        try {
          // Verify token with backend using API service
          console.log('Validating admin token...');
          const response = await apiService.getAdminProfile();
          console.log('Admin profile response:', response);
          
          if (response.success) {
            setAdmin(response.data.admin);
            setIsAuthenticated(true);
            console.log('Admin authenticated successfully');
          } else {
            // Token is invalid, clear storage
            console.log('Admin token validation failed, clearing storage');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            setAdmin(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Admin token validation failed:', error);
          // Clear invalid data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          setAdmin(null);
          setIsAuthenticated(false);
        }
      } else if (enableAutoLogin) {
        // For development: Auto-login with default admin credentials
        console.log('No admin data found, auto-logging in with default credentials for development');
        try {
          console.log('Attempting auto-login...');
          console.log('API Base URL:', apiService.baseURL);
          const loginData = await apiService.adminLogin('panchalajay717@gmail.com', 'admin123');
          console.log('Auto-login response:', loginData);
          
          if (loginData.success) {
            setAdmin(loginData.data.admin);
            setIsAuthenticated(true);
            localStorage.setItem('adminUser', JSON.stringify(loginData.data.admin));
            localStorage.setItem('adminToken', loginData.data.token);
            console.log('Auto-login successful');
            console.log('Admin token saved:', loginData.data.token ? 'Yes' : 'No');
          } else {
            console.log('Auto-login failed:', loginData.message);
            setAdmin(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
          console.error('Auto-login error details:', error.message);
          setAdmin(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('No admin session found. Auto-login disabled; awaiting manual login.');
        setAdmin(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const login = async (adminData, token) => {
    setAdmin(adminData);
    setIsAuthenticated(true);
    localStorage.setItem('adminUser', JSON.stringify(adminData));
    localStorage.setItem('adminToken', token);
  };

  const logout = async () => {
    try {
      // Note: There's no logout endpoint in the API service, so we'll just clear local storage
      // If you need to implement server-side logout, add it to the API service
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
    }
  };

  const updateAdmin = (updatedData) => {
    const updatedAdmin = { ...admin, ...updatedData };
    setAdmin(updatedAdmin);
    localStorage.setItem('adminUser', JSON.stringify(updatedAdmin));
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    adminToken: localStorage.getItem('adminToken'),
    login,
    logout,
    updateAdmin,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
