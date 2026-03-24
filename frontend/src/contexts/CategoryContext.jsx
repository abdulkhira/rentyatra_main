import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const CategoryContext = createContext(null);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
};

// Image map for category images - will be populated from backend
export const imageMap = {};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching categories from API...');
        const response = await apiService.getPublicCategories(1, 100); // Get all categories
        console.log('Categories API response:', response);
        const fetchedCategories = response.data.categories || [];
        
        // Transform backend categories to frontend format
        const transformedCategories = fetchedCategories.map(category => ({
          id: category._id,
          name: category.name,
          slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          image: category.images?.[0]?.url || null,
          product: category.product,
          subcategories: [] // Categories from backend don't have subcategories in this structure
        }));
        
        setCategories(transformedCategories);
        
        // Update imageMap with category images
        transformedCategories.forEach(category => {
          if (category.image) {
            imageMap[category.name] = category.image;
          }
        });
        
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setCategories([]); // Set empty array on error
        // Don't throw the error, just log it and continue
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch categories by product
  const fetchCategoriesByProduct = async (productId) => {
    try {
      const response = await apiService.getCategoriesByProduct(productId);
      return response.data.categories || [];
    } catch (err) {
      console.error('Error fetching categories by product:', err);
      return [];
    }
  };

  // Refresh categories from backend
  const refreshCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPublicCategories(1, 100);
      const fetchedCategories = response.data.categories || [];
      
      const transformedCategories = fetchedCategories.map(category => ({
        id: category._id,
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        image: category.images?.[0]?.url || null,
        product: category.product,
        subcategories: []
      }));
      
      setCategories(transformedCategories);
      
      // Update imageMap
      transformedCategories.forEach(category => {
        if (category.image) {
          imageMap[category.name] = category.image;
        }
      });
      
    } catch (err) {
      console.error('Error refreshing categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get category by slug
  const getCategoryBySlug = (slug) => {
    return categories.find(cat => cat.slug === slug);
  };

  // Get category by ID
  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id);
  };

  const value = {
    categories: categories || [],
    loading: loading || false,
    error: error || null,
    fetchCategoriesByProduct,
    refreshCategories,
    getCategoryBySlug,
    getCategoryById,
    imageMap: imageMap || {},
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;

