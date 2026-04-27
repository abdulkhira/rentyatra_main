import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Heart, PackageSearch } from 'lucide-react';
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
        }

        // Store all data
        setAllProducts(filteredProducts);
        setBackendCategories(fetchedCategories);

        // Handle categoryId parameter - direct navigation to rental requests
        if (categoryIdParam) {
          const targetCategory = fetchedCategories.find(category => category._id === categoryIdParam);
          if (targetCategory) {
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

          if (productId) {
            initialProduct = filteredProducts.find(product => product._id === productId);
          } else if (categorySlug) {
            initialProduct = filteredProducts.find(product =>
              product.name.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
            );
          }

          if (initialProduct) {
            setSelectedProduct(initialProduct);
            // Find subcategories for this product
            const productSubcategories = fetchedCategories.filter(category =>
              category.product && category.product._id === initialProduct._id
            );
            setSubcategories(productSubcategories);

            // Automatically navigate to categories view if productId is provided
            if (productId) {
              setNavigationLevel('categories');
            }
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
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans">
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
          <p className="text-gray-500 font-bold tracking-tight">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an error loading data
  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans">
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Oops!</h2>
          <p className="text-gray-500 mb-6 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-[#fc8019] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5] flex flex-col overflow-x-hidden font-sans">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center h-16 px-4">
          <button
            onClick={() => navigationLevel === 'categories' ? navigate('/') : goBack()}
            className="w-10 h-10 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors mr-3 border border-transparent hover:border-gray-200"
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight line-clamp-1">
              {navigationLevel === 'products' && (tagParam ? `${tagParam} Categories` : 'Explore Categories')}
              {navigationLevel === 'categories' && selectedProduct && `${selectedProduct.name}`}
              {navigationLevel === 'rental-requests' && selectedCategoryLocal && `${selectedCategoryLocal.name} Rentals`}
            </h1>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      <div className="flex flex-1 overflow-x-hidden max-w-[1200px] mx-auto w-full bg-white shadow-sm border-x border-gray-100 min-h-[calc(100vh-4rem)]">

        {/* Sidebar - Dynamic Content Based on Navigation Level */}
        <div className="w-[84px] md:w-28 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0 py-3 custom-scrollbar">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4 p-2">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full mx-auto mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded-full w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-2 text-center">
              <div className="text-[10px] font-bold text-red-500">Error</div>
            </div>
          ) : (
            <>
              {/* Always Show Products in Sidebar (except when viewing rental requests) */}
              {(navigationLevel === 'products' || navigationLevel === 'categories') && (
                allProducts.length === 0 ? (
                  <div className="p-2 text-center">
                    <div className="text-[10px] font-bold text-gray-400">No items</div>
                  </div>
                ) : (
                  allProducts.map((product) => {
                    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                    const isSelected = selectedProduct && selectedProduct._id === product._id;

                    return (
                      <button
                        key={product._id}
                        onClick={() => handleSidebarProductClick(product)}
                        className="w-full flex flex-col items-center gap-1.5 py-3 transition-all duration-200 relative group"
                      >
                        {/* Swiggy Orange Active Indicator line */}
                        {isSelected && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#fc8019] rounded-l-full"></div>
                        )}

                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center p-0.5 transition-colors ${isSelected ? 'bg-orange-50' : 'bg-transparent group-hover:bg-gray-50'
                          }`}>
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={product.name}
                              className={`w-full h-full object-cover rounded-full ${isSelected ? 'border-2 border-[#fc8019]' : 'border border-gray-200 group-hover:border-gray-300'}`}
                            />
                          ) : (
                            <div className={`w-full h-full bg-gray-100 rounded-full flex items-center justify-center ${isSelected ? 'border-2 border-[#fc8019]' : 'border border-gray-200'}`}>
                              <PackageSearch size={20} className={isSelected ? 'text-[#fc8019]' : 'text-gray-400'} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] md:text-[10px] font-bold text-center leading-tight px-1 line-clamp-2 ${isSelected ? 'text-[#fc8019]' : 'text-gray-600'
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
                    <div className="text-[10px] font-bold text-gray-400">No categories</div>
                  </div>
                ) : (
                  subcategories.map((category) => {
                    const primaryImage = category.images?.find(img => img.isPrimary) || category.images?.[0];
                    const isSelected = selectedCategoryLocal && selectedCategoryLocal._id === category._id;

                    return (
                      <button
                        key={category._id}
                        onClick={() => handleSidebarCategoryClick(category)}
                        className="w-full flex flex-col items-center gap-1.5 py-3 transition-all duration-200 relative group"
                      >
                        {/* Swiggy Orange Active Indicator line */}
                        {isSelected && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#fc8019] rounded-l-full"></div>
                        )}

                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center p-0.5 transition-colors ${isSelected ? 'bg-orange-50' : 'bg-transparent group-hover:bg-gray-50'
                          }`}>
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={category.name}
                              className={`w-full h-full object-cover rounded-full ${isSelected ? 'border-2 border-[#fc8019]' : 'border border-gray-200 group-hover:border-gray-300'}`}
                            />
                          ) : (
                            <div className={`w-full h-full bg-gray-100 rounded-full flex items-center justify-center ${isSelected ? 'border-2 border-[#fc8019]' : 'border border-gray-200'}`}>
                              <PackageSearch size={20} className={isSelected ? 'text-[#fc8019]' : 'text-gray-400'} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] md:text-[10px] font-bold text-center leading-tight px-1 line-clamp-2 ${isSelected ? 'text-[#fc8019]' : 'text-gray-600'
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-8 bg-[#f8f9fa]">

          {/* Swiggy-Style Promotion Banner */}
          <div className="p-4 md:p-6 pb-2">
            <div className="bg-gradient-to-r from-[#fc8019] to-[#ffc107] rounded-3xl p-5 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Decorative background elements */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>

              <div className="relative z-10 mb-4 md:mb-0">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2">Limited Time</div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">Festival Special!</h2>
                <p className="text-white/90 text-sm md:text-base font-medium">Special discounts across all categories.</p>
              </div>

              <button className="relative z-10 bg-white text-[#fc8019] hover:bg-gray-50 font-extrabold py-2.5 px-6 rounded-xl text-sm md:text-base shadow-sm transition-transform active:scale-95">
                Explore Now
              </button>
            </div>
          </div>

          {/* Dynamic Content Section */}
          <div className="px-4 md:px-6 py-4">

            <div className="mb-5">
              <h3 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                {navigationLevel === 'products' && `All Options (${backendCategories.length})`}
                {navigationLevel === 'categories' && selectedProduct && `${selectedProduct.name} Categories (${subcategories.length})`}
                {navigationLevel === 'rental-requests' && selectedCategoryLocal && `Available Rentals (${rentalRequests.length})`}
              </h3>
            </div>

            {(() => {
              if (loading || loadingRentals) {
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="animate-pulse bg-white p-3 rounded-2xl border border-gray-100">
                        <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl mb-3"></div>
                        <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 mx-auto max-w-md">
                    <p className="text-red-500 font-bold mb-4">Error loading data: {error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2.5 bg-[#fc8019] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                );
              }

              // Level 1 & 2: Show Categories Grid (Circular Swiggy style)
              if (navigationLevel === 'products' || navigationLevel === 'categories') {
                const itemsToShow = navigationLevel === 'products' ? backendCategories : subcategories;

                if (itemsToShow.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                      <div className="text-5xl mb-4">📂</div>
                      <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">No categories found</h3>
                      <p className="text-gray-500 font-medium">Nothing to show here right now.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-8 gap-x-4">
                    {itemsToShow.map((category) => {
                      const primaryImage = category.images?.find(img => img.isPrimary) || category.images?.[0];

                      return (
                        <button
                          key={category._id}
                          onClick={() => {
                            if (navigationLevel === 'products') {
                              navigateToRentalRequests(category);
                            } else {
                              handleSidebarCategoryClick(category);
                            }
                          }}
                          className="group flex flex-col items-center transition-transform active:scale-95"
                        >
                          {/* Circular Category Image */}
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-md group-hover:border-[#fc8019]/30 transition-all duration-300">
                            {primaryImage && primaryImage.url ? (
                              <img
                                src={primaryImage.url}
                                alt={category.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement.querySelector('.image-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}

                            {/* Fallback */}
                            <div
                              className="image-fallback w-full h-full bg-gray-50 rounded-full flex items-center justify-center"
                              style={{ display: primaryImage && primaryImage.url ? 'none' : 'flex' }}
                            >
                              <PackageSearch size={28} className="text-gray-300" />
                            </div>
                          </div>

                          {/* Category Name */}
                          <div className="mt-3 text-center px-1">
                            <h4 className="font-bold text-xs md:text-sm text-gray-800 group-hover:text-[#fc8019] transition-colors duration-200 line-clamp-2 leading-tight">
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
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-500 font-bold mb-5">No rentals found for this category.</p>
                      <button
                        onClick={() => navigate('/listings')}
                        className="px-6 py-3 bg-[#fc8019] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                      >
                        Browse All Listings
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {rentalRequests.map((request) => (
                      <div
                        key={request._id}
                        onClick={() => navigate(`/rental/${request._id}`)}
                        className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group"
                      >
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(request._id);
                          }}
                          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={16}
                            className={isFavorite(request._id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-[#fc8019] transition-colors'}
                          />
                        </button>

                        <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                          {request.images && request.images.length > 0 ? (
                            <img
                              src={request.images.find(img => img.isPrimary)?.url || request.images[0].url}
                              alt={request.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PackageSearch size={32} className="text-gray-300" />
                            </div>
                          )}
                          {/* Bottom Orange Accent line on hover */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#fc8019] to-[#ffc107] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-extrabold text-gray-900 mb-1 text-base tracking-tight line-clamp-1 group-hover:text-[#fc8019] transition-colors">{request.title}</h3>
                          <p className="text-gray-500 text-xs mb-3 font-medium line-clamp-1">{request.description}</p>

                          <div className="w-full h-px bg-gray-100 mb-3"></div>

                          <div className="flex items-end justify-between">
                            <div>
                              <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                                ₹{request.price?.amount || 0}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">
                                / {request.price?.period || 'day'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
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