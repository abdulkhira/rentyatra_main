import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ArrowLeft, ArrowRight, Check, ChevronRight, Search, Loader2, Crown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCategories } from '../../contexts/CategoryContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SellerLocationPicker from '../../components/common/SellerLocationPicker';
import apiService from '../../services/api';
import { uploadToCloudinary } from '../../services/uploadToCloudinary';

const PostAd = () => {
  const { addItem } = useApp();
  const { categories, imageMap, loading: categoriesLoading } = useCategories();
  const { isAuthenticated, user } = useAuth();
  const { refreshUserSubscription, userSubscription, subscriptionPlans } = useSubscription();
  const navigate = useNavigate();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1); // 1: Product, 2: Category, 3: Details
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Product management state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Category management state
  const [productCategories, setProductCategories] = useState([]);

  // Location state
  const [coordinates, setCoordinates] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerDay: '',
    location: '',
    coordinates: null, // Store lat/lng coordinates
    serviceRadius: 7, // Default service radius
    condition: 'good',
    phone: '',
    // email: '',
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  // const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Handle location selection from SellerLocationPicker
  const handleLocationSelect = async (location) => {
    console.log('=== LOCATION SELECTED ===');
    console.log('Location selected with radius:', location);
    console.log('Debug - location.radius:', location.radius);
    console.log('Debug - typeof location.radius:', typeof location.radius);
    console.log('Debug - location.address:', location.address);
    console.log('Debug - location.city:', location.city);
    console.log('Debug - Current formData.serviceRadius:', formData.serviceRadius);
    setCoordinates(location);

    // Reverse geocode to get address name
    let addressName = `${location.lat}, ${location.lng}`; // fallback
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
      );
      const data = await res.json();
      addressName = data.display_name || addressName;
      console.warn('=====>', addressName);

    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }

    setFormData(prev => ({
      ...prev,
      coordinates: location,
      serviceRadius: location.radius || 7, // Use the radius from location or default to 7
      location: addressName // Use actual address instead of hardcoded text
      // location: location.address || `${location.lat}, ${location.lng}` // Use actual address instead of hardcoded text
    }));
    console.log('Debug - Updated formData.serviceRadius to:', location.radius || 7);
    console.log('Debug - Updated formData.location to:', location.address || `${location.lat}, ${location.lng}`);
    console.log('=== END LOCATION SELECTED ===');
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPublicProducts(1, 50, productSearch);
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearch !== '') {
        fetchProducts();
      } else {
        fetchProducts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  // Fetch categories by product
  const fetchCategoriesByProduct = async (productId) => {
    try {
      const response = await apiService.getCategoriesByProduct(productId);
      if (response.success) {
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

        setProductCategories(transformedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories by product:', error);
      setError('Failed to load categories');
      setProductCategories([]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pb-20 md:pb-0">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to list your item for rent</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  // Show loading state while categories are being fetched
  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pb-20 md:pb-0">
        <Card className="p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load the categories</p>
        </Card>
      </div>
    );
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Don't pre-fill title, let user enter manually
    // Fetch categories for the selected product
    fetchCategoriesByProduct(product._id);
    setCurrentStep(2);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFormData({ ...formData, category: category.slug });
    setCurrentStep(3);
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Check if adding these files would exceed the minimum requirement
    if (images.length + files.length < 4) {
      setError('Please upload at least 4 images');
    } else {
      setError('');
    }

    // Instead of Base64, store the actual File and a lightweight preview URL
    const newImageObjects = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => {
      const updatedImages = [...prev, ...newImageObjects];
      if (updatedImages.length >= 4) {
        setError('');
      }
      return updatedImages;
    });
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      // Free up browser memory when an image is removed
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);

      if (newImages.length < 4) {
        setError('Please upload at least 4 images');
      }
      return newImages;
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size should be less than 50MB');
        return;
      }

      setError('');

      // Clean up previous video memory if it exists
      if (video?.preview) {
        URL.revokeObjectURL(video.preview);
      }

      // Store the native file and a lightweight preview
      setVideo({
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2)
      });
    }
  };

  const removeVideo = () => {
    setVideo(null);
  };

  // Check if user has remaining post ads
  // const checkPostAdsAvailability = () => {
  //   if (!userSubscription || userSubscription.status !== 'active') {
  //     return 0; // No subscription
  //   }

  //   const plan = subscriptionPlans.find(p => p.id === userSubscription.planId);
  //   if (plan) {
  //     const currentListings = userSubscription.currentListings || 0;
  //     const maxListings = plan.maxListings === -1 ? Infinity : plan.maxListings;
  //     return Math.max(0, maxListings - currentListings);
  //   } else {
  //     // Fallback for custom plans (like new_user_default)
  //     const currentListings = userSubscription.currentListings || 0;
  //     const maxListings = userSubscription.maxListings || 0;
  //     return Math.max(0, maxListings - currentListings);
  //   }
  // };


  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // 1. Upload Assets to Cloudinary
    const imageUrls = [];
    for (let img of images) {
      const url = await uploadToCloudinary(img.file, "image");
      imageUrls.push(url);
    }
    const videoUrl = video?.file ? await uploadToCloudinary(video.file, "video") : "";

    // 2. Prepare FormData (Matching your curl request keys)
    // const formDataToSend = new FormData();
    
    // formDataToSend.append('title', formData.title);
    // formDataToSend.append('description', formData.description);
    // formDataToSend.append('priceAmount', formData.pricePerDay);
    // formDataToSend.append('pricePeriod', 'daily');
    // formDataToSend.append('product', selectedProduct._id);
    // formDataToSend.append('category', selectedCategory._id || selectedCategory.id);
    // formDataToSend.append('location', formData.location);
    // formDataToSend.append('city', coordinates?.city || 'Not specified');
    // formDataToSend.append('state', coordinates?.state || 'Not specified');
    // formDataToSend.append('pincode', formData.pincode || '361001');
    // formDataToSend.append('phone', formData.phone);
    // formDataToSend.append('email', formData.email || 'test@gmail.com');
    // formDataToSend.append('serviceRadius', formData.serviceRadius || 7);

    // // Stringified Objects/Arrays
    // formDataToSend.append('coordinates', JSON.stringify({
    //   lat: formData.coordinates.lat,
    //   lng: formData.coordinates.lng
    // }));

    // const imagesArray = imageUrls.map((url, index) => ({
    //   url: url,
    //   publicId: "",
    //   isPrimary: index === 0
    // }));
    // formDataToSend.append('images', JSON.stringify(imagesArray));

    // if (videoUrl) {
    //   formDataToSend.append('video', JSON.stringify({ url: videoUrl, publicId: "" }));
    // }

    const payload = {
      title: formData.title,
      description: formData.description,
      priceAmount: formData.pricePerDay,
      pricePeriod: "daily",
      product: selectedProduct._id,
      category: selectedCategory._id || selectedCategory.id,
      location: formData.location,
      city: coordinates?.city || 'Not specified',
      state: coordinates?.state || 'Not specified',
      pincode: formData.pincode || '361001',
      phone: formData.phone,
      email: formData.email || 'test@gmail.com',
      serviceRadius: formData.serviceRadius || 7,
      coordinates: {
        lat: formData.coordinates.lat,
        lng: formData.coordinates.lng
      },
      images: imageUrls.map((url, index) => ({
        url,
        publicId: "",
        isPrimary: index === 0
      })),
      video: videoUrl
        ? { url: videoUrl, publicId: "" }
        : null
    };

    // 3. Submit
    const response = await apiService.createRentalListing(payload);

    if (response.success) {
      alert('Success!');
      navigate('/dashboard');
    } else {
      setError(response.message);
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-3 md:py-6 px-3 md:px-4 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-center gap-1 md:gap-4">
            {[
              { step: 1, label: 'Category' },
              { step: 2, label: 'Sub Category' },
              { step: 3, label: 'Details' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all ${currentStep > item.step
                    ? 'bg-green-500 text-white'
                    : currentStep === item.step
                      ? 'bg-blue-600 text-white shadow-lg md:scale-110'
                      : 'bg-gray-200 text-gray-500'
                    }`}>
                    {currentStep > item.step ? <Check size={14} className="md:w-5 md:h-5" /> : item.step}
                  </div>
                  <span className={`text-[10px] md:text-sm font-semibold mt-1 md:mt-2 ${currentStep >= item.step ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {item.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-8 md:w-20 h-0.5 md:h-1 mx-1 md:mx-2 rounded-full transition-all ${currentStep > item.step ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Product Selection */}
        {currentStep === 1 && (
          <Card className="p-4 md:p-8">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-3xl font-black text-gray-900 mb-1 md:mb-2">Select Category</h2>
              <p className="text-xs md:text-base text-gray-600">Choose the Category that best fits your item</p>
            </div>

            {/* Search Bar */}
            <div className="mb-4 md:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                {products.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className="group bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-3 md:p-4 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-full h-16 md:h-20 mb-2 md:mb-3 bg-gray-100 rounded-lg md:rounded-xl flex items-center justify-center p-2 group-hover:bg-blue-50 transition-all">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs md:text-sm">No Image</div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                      {product.name}
                    </h3>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No categories found</p>
                <Button onClick={() => setProductSearch('')}>Clear Search</Button>
              </div>
            )}
          </Card>
        )}

        {/* Step 2: Category Selection */}
        {currentStep === 2 && (
          <Card className="p-4 md:p-8">
            <div className="mb-4 md:mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold mb-3 md:mb-4 group"
              >
                <ArrowLeft size={16} className="md:w-[18px] md:h-[18px] group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs md:text-sm">Back to Categories</span>
              </button>
              <h2 className="text-lg md:text-3xl font-black text-gray-900 mb-1 md:mb-2">
                Select Sub Category
              </h2>
              <p className="text-xs md:text-base text-gray-600">
                Choose sub category for <span className="font-bold text-blue-600">{selectedProduct?.name}</span>
              </p>
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : productCategories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {productCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="group bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-3 md:p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-2 md:mb-3 bg-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center p-2 md:p-3 group-hover:bg-blue-50 transition-all">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs md:text-sm">No Image</div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs md:text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No sub categories found for this product</p>
                <Button onClick={() => setCurrentStep(1)}>Back to Products</Button>
              </div>
            )}
          </Card>
        )}

        {/* Step 3: Product Details Form */}
        {currentStep === 3 && (
          <Card className="p-4 md:p-8">
            <div className="mb-4 md:mb-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold mb-3 md:mb-4 group"
              >
                <ArrowLeft size={16} className="md:w-[18px] md:h-[18px] group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs md:text-sm">Back to Sub Categories</span>
              </button>
              <h2 className="text-lg md:text-3xl font-black text-gray-900 mb-1 md:mb-2">Product Details</h2>
              <p className="text-xs md:text-base text-gray-600">
                {selectedProduct?.name} → <span className="font-bold text-blue-600">{selectedCategory?.name}</span>
              </p>
            </div>


            <form onSubmit={(e) => {
              console.log('Form onSubmit triggered!');
              handleSubmit(e);
            }} className="space-y-4 md:space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Canon EOS R6 Camera"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your item in detail..."
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Rental Price Per Day *
                </label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  placeholder="₹500"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Select Your Service Area *
                </label>
                <SellerLocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={coordinates}
                  radiusKm={7}
                  serviceRadius={formData.serviceRadius || 7}
                  onRadiusChange={(radius) => {
                    setFormData(prev => ({
                      ...prev,
                      serviceRadius: radius
                    }));
                  }}
                />

                {/* Service Radius */}
                <div className="mt-4">
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                    Service Radius (km) *
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.serviceRadius || 7}
                            onChange={(e) => {
                              const radius = parseInt(e.target.value) || 7;
                              setFormData(prev => ({
                                ...prev,
                                serviceRadius: radius
                              }));
                            }}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                            placeholder="7"
                          />
                          <span className="text-sm text-gray-600">km</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Adjust your service area radius (1-50 km)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full opacity-30"></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Service Area</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Phone */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                    Email Address{' '}
                    <span className="text-[10px] md:text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="new">New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>


              {/* Images Upload */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Images * <span className="text-[10px] md:text-xs font-normal text-gray-500">(Minimum 4 required)</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview} // <--- Use the preview property
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 md:h-32 object-cover rounded-lg md:rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white p-1 md:p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="md:w-[14px] md:h-[14px]" />
                      </button>
                    </div>
                  ))}
                  {images.length < 10 && (
                    <label className="border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl h-20 md:h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload className="text-gray-400 mb-1 md:mb-2" size={18} />
                      <span className="text-[10px] md:text-xs text-gray-600 font-medium">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2">
                  {images.length}/4 images uploaded (min 4 required)
                </p>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                  Video * <span className="text-[10px] md:text-xs font-normal text-gray-500">(Required, max 50MB)</span>
                </label>
                {!video ? (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl p-4 md:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <Upload className="text-gray-400 mb-2 md:mb-3" size={24} />
                    <span className="text-xs md:text-sm text-gray-700 font-semibold mb-1">Upload Video</span>
                    <span className="text-[10px] md:text-xs text-gray-500">Max 50MB</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative group">
                    <video
                      src={video.preview}
                      className="w-full h-32 md:h-48 object-cover rounded-lg md:rounded-xl"
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 md:top-3 right-2 md:right-3 bg-red-500 text-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                    >
                      <X size={14} />
                      Remove
                    </button>
                    <div className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-gray-600">
                      {video.name} ({video.size} MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 md:pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => {
                    console.log('Submit button clicked!');
                    console.log('Loading state:', loading);
                    console.log('Form data:', formData);
                    console.log('Images:', images.length);
                    console.log('Video:', video);
                    console.log('Selected product:', selectedProduct);
                    console.log('Selected category:', selectedCategory);
                    // Let the form handle the submission
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 md:py-4 text-base md:text-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Post Rental
                      <ChevronRight className="ml-2" size={18} />
                    </>
                  )}
                </Button>
              </div>
            </form>
            {error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-red-700 text-xs md:text-sm font-medium">{error}</p>
              </div>
            )}

          </Card>
        )}
      </div>

      {/* Subscription Required Modal */}
      {/* {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">No Post Ads Remaining</h3>
              <p className="text-gray-600 mb-6">
                You've used all your free post ads. Upgrade to a subscription plan to post more rentals and reach more customers.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    navigate('/subscription');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-white font-bold"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  View Subscription Plans
                </Button>

                <Button
                  onClick={() => setShowSubscriptionModal(false)}
                  variant="outline"
                  className="w-full py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default PostAd;
