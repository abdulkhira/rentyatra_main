import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useCategories } from '../../contexts/CategoryContext';
import { useState, useEffect } from 'react';
import apiService from '../../services/api';


const CategoryDetail = () => {
  const { categorySlug } = useParams();
  const { categories, setSelectedCategory, toggleFavorite, isFavorite } = useApp();
  const { getCategoryBySlug } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for tag and categoryId parameters in URL
  const urlParams = new URLSearchParams(location.search);
  const tagParam = urlParams.get('tag');
  const categoryIdParam = urlParams.get('categoryId');

  // Check if this is a rentals page
  const isRentalsPage = location.pathname.includes('/rentals');

  // Navigation state management
  const [navigationLevel, setNavigationLevel] = useState('products'); // 'products', 'categories', 'rental-requests'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategoryLocal, setSelectedCategoryLocal] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);

  // State for products and loading
  const [allProducts, setAllProducts] = useState([]); // Store all products (for sidebar)
  const [backendCategories, setBackendCategories] = useState([]); // Store categories from backend
  const [subcategories, setSubcategories] = useState([]); // Store subcategories for selected main category
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for rental requests
  const [rentalRequests, setRentalRequests] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false);

  const currentCategory = getCategoryBySlug(categorySlug) || categories[0];

  // Navigation helper functions
  const navigateToProducts = () => {
    setNavigationLevel('categories');
    setSelectedProduct(null);
    setSelectedCategoryLocal(null);
    setSubcategories([]);
    setRentalRequests([]);
    setNavigationHistory([]);
  };

  const navigateToCategories = (product) => {
    setNavigationLevel('categories');
    setSelectedProduct(product);
    setSelectedCategoryLocal(null);
    setRentalRequests([]);

    // Find subcategories for this product
    const productSubcategories = backendCategories.filter(category =>
      category.product && category.product._id === product._id
    );
    setSubcategories(productSubcategories);

    // Add to navigation history
    setNavigationHistory(prev => [...prev, { level: 'categories', item: product }]);
  };

  const navigateToRentalRequests = (category) => {
    setNavigationLevel('rental-requests');
    setSelectedCategoryLocal(category);

    // Add to navigation history
    setNavigationHistory(prev => [...prev, { level: 'categories', item: category }]);

    // Fetch rental requests for this category
    fetchRentalRequestsByCategory(category.name);
  };

  const goBack = () => {
    if (navigationHistory.length === 0) {
      navigateToProducts();
      return;
    }

    const lastHistory = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(prev => prev.slice(0, -1));

    if (lastHistory.level === 'categories') {
      navigateToProducts();
    } else if (lastHistory.level === 'categories') {
      navigateToCategories(selectedProduct);
    }
  };

  // Fetch rental requests by category
  const fetchRentalRequestsByCategory = async (categoryName) => {
    setLoadingRentals(true);
    try {
      const response = await apiService.getPublicRentalRequests(1, 50, '', categoryName);
      if (response.success) {
        setRentalRequests(response.data.requests || []);
      } else {
        setError('Failed to load rental requests');
      }
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      setError('Failed to load rental requests');
    } finally {
      setLoadingRentals(false);
    }
  };

  // Fetch products and categories
  useEffect(() => {
    const fetchProducts = async () => {

      try {
        setLoading(true);
        setError(null);

        // If this is a rentals page, fetch rental requests instead
        if (isRentalsPage && categorySlug) {
          const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          await fetchRentalRequestsByCategory(categoryName);
          setLoading(false);
          return;
        }

        // Fetch both products and categories from backend
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiService.getPublicProducts(1, 100, ''), // Get all products
          apiService.getPublicCategories(1, 100, '') // Get all categories
        ]);

        const fetchedProducts = productsResponse.data.products || [];
        const fetchedCategories = categoriesResponse.data.categories || [];

        // Filter products by tag if tag parameter is provided
        let filteredProducts = fetchedProducts;
        if (tagParam) {
          filteredProducts = fetchedProducts.filter(product =>
            product.tags && product.tags.some(tag =>
              tag.toLowerCase().includes(tagParam.toLowerCase())
            )
          );
          console.log(`Filtered categories by tag "${tagParam}":`, filteredProducts.length);
        }

        console.log('Fetched categories:', fetchedProducts.length);
        console.log('Fetched categories:', fetchedCategories.length);
        console.log('Categories:', fetchedCategories.map(c => ({
          id: c._id,
          name: c.name,
          product: c.product?.name,
          productId: c.product?._id,
          images: c.images?.length || 0,
          imageUrl: c.images?.[0]?.url
        })));
        console.log('All categories:', fetchedProducts.map(p => ({ id: p._id, name: p.name })));

        // Store all data
        setAllProducts(filteredProducts);
        setBackendCategories(fetchedCategories);

        // Handle categoryId parameter - direct navigation to rental requests
        if (categoryIdParam) {
          const targetCategory = fetchedCategories.find(category => category._id === categoryIdParam);
          if (targetCategory) {
            console.log('Found category by ID:', targetCategory);
            setSelectedCategoryLocal(targetCategory);
            setNavigationLevel('rental-requests');
            await fetchRentalRequestsByCategory(targetCategory.name);
            setLoading(false);
            return;
          }
        }

        // Set initial selected product based on URL parameter or query parameter
        if (filteredProducts.length > 0) {
          let initialProduct = null;

          // Check for productId query parameter first
          const urlParams = new URLSearchParams(location.search);
          const productId = urlParams.get('productId');

          console.log('URL params:', { productId, categorySlug, location: location.search });
          console.log('Available categories:', filteredProducts.map(p => ({ id: p._id, name: p.name })));

          if (productId) {
            // Find product by ID from query parameter
            initialProduct = filteredProducts.find(product => product._id === productId);
            console.log('Found product by ID:', initialProduct);
          } else if (categorySlug) {
            // Fallback to categorySlug parameter
            initialProduct = filteredProducts.find(product =>
              product.name.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
            );
            console.log('Found product by slug:', initialProduct);
          }

          if (initialProduct) {
            setSelectedProduct(initialProduct);
            // Find subcategories for this product
            const productSubcategories = fetchedCategories.filter(category =>
              category.product && category.product._id === initialProduct._id
            );
            console.log('Product subcategories:', productSubcategories);
            setSubcategories(productSubcategories);

            // Automatically navigate to categories view if productId is provided
            if (productId) {
              setNavigationLevel('categories');
              console.log('Auto-navigating to categories view for product:', initialProduct.name);
            }
          } else {
            console.log('No initial product found, showing all categories');
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, location.search]);





  // Function to handle sidebar product click
  const handleSidebarProductClick = (product) => {
    navigateToCategories(product);
  };

  // Function to handle sidebar category click
  const handleSidebarCategoryClick = (category) => {
    navigateToRentalRequests(category);
  };

  // Show loading if data is still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories and categories...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an error loading data
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Error loading data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigationLevel === 'categories' ? navigate('/') : goBack()}
            className="p-2 hover:bg-gray-100 rounded-full transition mr-3"
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {navigationLevel === 'products' && (tagParam ? `${tagParam} Categories` : 'Categories')}
              {navigationLevel === 'categories' && selectedProduct && `${selectedProduct.name} Categories`}
              {navigationLevel === 'rental-requests' && selectedCategoryLocal && `${selectedCategoryLocal.name} Rentals`}
            </h1>
            {/* Breadcrumb */}
          {/*  {navigationHistory.length > 0 && (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Categories</span>
                {navigationHistory.map((history, index) => (
                  <span key={index} className="flex items-center">
                    <span className="mx-2">›</span>
                    <span>{history.item.name}</span>
                  </span>
                ))}
              </div>
            )}
             */}
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14"></div>

      <div className="flex flex-1 overflow-x-hidden">
        {/* Sidebar - Dynamic Content Based on Navigation Level */}
        <div className="w-20 md:w-24 bg-blue-50 border-r border-gray-200 overflow-y-auto flex-shrink-0 py-2">
          {loading ? (
            // Loading skeleton
            <div className="space-y-2 p-2">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-2 text-center">
              <div className="text-[8px] text-red-500">Error loading data</div>
            </div>
          ) : (
            <>
              {/* Always Show Products in Sidebar (except when viewing rental requests) */}
              {(navigationLevel === 'products' || navigationLevel === 'categories') && (
                allProducts.length === 0 ? (
                  <div className="p-2 text-center">
                    <div className="text-[8px] text-gray-500">No products found</div>
                  </div>
                ) : (
                  allProducts.map((product) => {
                    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                    const isSelected = selectedProduct && selectedProduct._id === product._id;

                    return (
                      <button
                        key={product._id}
                        onClick={() => handleSidebarProductClick(product)}
                        className={`w-full flex flex-col items-center gap-1 py-3 px-1 mx-1 my-1 transition-all duration-200 ${isSelected
                          ? 'bg-white shadow-md rounded-lg border-r-2 border-blue-500'
                          : 'hover:bg-white hover:shadow-sm rounded-lg'
                          }`}
                      >
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product.name}
                            className={`w-11 h-11 md:w-12 md:h-12 object-contain rounded-lg p-0.5 ${isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                          />
                        ) : (
                          <div className={`w-11 h-11 md:w-12 md:h-12 bg-gray-200 rounded-lg flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500' : ''
                            }`}>
                            <span className="text-[8px] text-gray-400">📦</span>
                          </div>
                        )}
                        <span className={`text-[7px] md:text-[8px] font-semibold text-center leading-tight px-0.5 line-clamp-2 ${isSelected ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                          {product.name}
                        </span>
                      </button>
                    );
                  })
                )
              )}

              {/* Show Categories in Sidebar only when viewing rental requests */}
              {navigationLevel === 'rental-requests' && (
                subcategories.length === 0 ? (
                  <div className="p-2 text-center">
                    <div className="text-[8px] text-gray-500">No categories found</div>
                  </div>
                ) : (
                  subcategories.map((category) => {
                    const primaryImage = category.images?.find(img => img.isPrimary) || category.images?.[0];
                    const isSelected = selectedCategoryLocal && selectedCategoryLocal._id === category._id;

                    return (
                      <button
                        key={category._id}
                        onClick={() => handleSidebarCategoryClick(category)}
                        className={`w-full flex flex-col items-center gap-1 py-3 px-1 mx-1 my-1 transition-all duration-200 ${isSelected
                          ? 'bg-white shadow-md rounded-lg border-r-2 border-blue-500'
                          : 'hover:bg-white hover:shadow-sm rounded-lg'
                          }`}
                      >
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={category.name}
                            className={`w-11 h-11 md:w-12 md:h-12 object-contain rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                          />
                        ) : (
                          <div className={`w-11 h-11 md:w-12 md:h-12 bg-gray-200 rounded-lg flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500' : ''
                            }`}>
                            <span className="text-[8px] text-gray-400">📦</span>
                          </div>
                        )}
                        <span className={`text-[7px] md:text-[8px] font-semibold text-center leading-tight px-0.5 line-clamp-2 ${isSelected ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })
                )
              )}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-4">
          {/* Banner Ad */}
          <div className="p-3 md:p-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg md:rounded-xl p-4 md:p-6 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Festival Special!</h2>
              <p className="text-xs md:text-sm mb-3 md:mb-4">Special discounts on all categories</p>
              <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 md:py-2 md:px-6 rounded-lg text-xs md:text-sm transition">
                BOOK NOW
              </button>
            </div>
          </div>

          {/* Dynamic Content Section */}
          <div className="px-3 md:px-4 py-3 md:py-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {navigationLevel === 'products' && `All Categories (${backendCategories.length})`}
                {navigationLevel === 'categories' && selectedProduct && `${selectedProduct.name} Categories (${subcategories.length})`}
                {navigationLevel === 'rental-requests' && selectedCategoryLocal && `${selectedCategoryLocal.name} Rentals (${rentalRequests.length})`}
              </h3>
            </div>

            {(() => {
              if (loading || loadingRentals) {
                return (
                  <div className="grid grid-cols-4 gap-3 md:gap-4">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="w-full aspect-[3/2] bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">Error loading data: {error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                );
              }

              // Level 1: Show all categories (products)
              if (navigationLevel === 'products') {
                return (
                  <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {backendCategories.map((category) => {
                      const primaryImage = category.images?.find(img => img.isPrimary) || category.images?.[0];

                      return (
                        <button
                          key={category._id}
                          onClick={() => {
                            // Directly navigate to rental requests for this category
                            navigateToRentalRequests(category);
                          }}
                          className="group flex flex-col items-center transition-all duration-300 active:scale-95"
                        >
                          {/* Circular Category Icon */}
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all duration-300">
                            {primaryImage && primaryImage.url ? (
                              <img
                                src={primaryImage.url}
                                alt={category.name}
                                className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-full group-hover:scale-105 transition-transform duration-300 p-0.5"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement.querySelector('.image-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}

                            {/* Fallback for no image or error */}
                            <div
                              className="image-fallback w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
                              style={{ display: primaryImage && primaryImage.url ? 'none' : 'flex' }}
                            >
                              <div className="text-center">
                                <div className="text-lg md:text-xl">📦</div>
                              </div>
                            </div>
                          </div>

                          {/* Category Name */}
                          <div className="mt-2 text-center">
                            <h4 className="font-medium text-xs md:text-sm text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                              {category.name}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              }

              // Level 2: Show subcategories for selected product
              if (navigationLevel === 'categories') {
                if (subcategories.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📂</div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No categories found</h3>
                      <p className="text-gray-500">No categories available for {selectedProduct?.name} yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {subcategories.map((category) => {
                      const primaryImage = category.images?.find(img => img.isPrimary) || category.images?.[0];

                      return (
                        <button
                          key={category._id}
                          onClick={() => handleSidebarCategoryClick(category)}
                          className="group flex flex-col items-center transition-all duration-300 active:scale-95"
                        >
                          {/* Circular Category Icon */}
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all duration-300">
                            {primaryImage && primaryImage.url ? (
                              <img
                                src={primaryImage.url}
                                alt={category.name}
                                className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-full group-hover:scale-105 transition-transform duration-300 p-0.5"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement.querySelector('.image-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}

                            {/* Fallback for no image or error */}
                            <div
                              className="image-fallback w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
                              style={{ display: primaryImage && primaryImage.url ? 'none' : 'flex' }}
                            >
                              <div className="text-center">
                                <div className="text-lg md:text-xl">📦</div>
                              </div>
                            </div>
                          </div>

                          {/* Category Name */}
                          <div className="mt-2 text-center">
                            <h4 className="font-medium text-xs md:text-sm text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                              {category.name}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              }

              // Level 3: Show rental requests for selected category
              if (navigationLevel === 'rental-requests') {
                if (rentalRequests.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No rental requests found for this category</p>
                      <button
                        onClick={() => navigate('/listings')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Browse All Listings
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {rentalRequests.map((request) => (
                      <div
                        key={request._id}
                        onClick={() => navigate(`/rental/${request._id}`)}
                        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                      >
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(request._id);
                          }}
                          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg hover:scale-110 transition-all hover:bg-white"
                        >
                          <Heart
                            size={16}
                            className={isFavorite(request._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                          />
                        </button>

                        {request.images && request.images.length > 0 && (
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={request.images.find(img => img.isPrimary)?.url || request.images[0].url}
                              alt={request.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="p-2 md:p-3">
                          <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm line-clamp-1">{request.title}</h3>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">{request.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm md:text-base font-bold text-blue-600">
                              ₹{request.price?.amount || 0}/{request.price?.period || 'day'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {request.location?.city &&
                                request.location.city !== 'Unknown' &&
                                request.location.city !== 'Not specified' &&
                                request.location.city.trim() !== '' &&
                                request.location.city.length > 2 ?
                                request.location.city : 'Location'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return null;
            })()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;


