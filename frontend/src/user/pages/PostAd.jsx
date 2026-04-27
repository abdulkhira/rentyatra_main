import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ArrowLeft, Check, ChevronRight, Search, PackageSearch, PackagePlus, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
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

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [productCategories, setProductCategories] = useState([]);
  const [categoriesLoadingState, setCategoriesLoadingState] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [coordinates, setCoordinates] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerDay: '',
    location: '',
    coordinates: null,
    serviceRadius: 7,
    condition: 'good',
    phone: user?.phone || '',
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = async (location) => {
    setCoordinates(location);
    let addressName = `${location.lat}, ${location.lng}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
      );
      const data = await res.json();
      addressName = data.display_name || addressName;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
    setFormData(prev => ({
      ...prev,
      coordinates: location,
      serviceRadius: location.radius || 7,
      location: addressName,
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchProducts(), 500);
    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await apiService.getPublicProducts(1, 50, productSearch);
      if (response.success) setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategoriesByProduct = async (productId) => {
    setCategoriesLoadingState(true);
    setSelectedCategory(null);
    setProductCategories([]);
    try {
      const response = await apiService.getCategoriesByProduct(productId);
      if (response.success) {
        const fetched = response.data.categories || [];
        setProductCategories(fetched.map(cat => ({
          id: cat._id,
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          image: cat.images?.[0]?.url || null,
          product: cat.product,
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setProductCategories([]);
    } finally {
      setCategoriesLoadingState(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    fetchCategoriesByProduct(product._id);
    setShowProductDropdown(false);
    setProductSearch('');
    setError('');
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category: category.slug }));
    setShowCategoryDropdown(false);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImageObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => {
      const updated = [...prev, ...newImageObjects];
      if (updated.length >= 4) setError('');
      return updated;
    });
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      if (updated.length < 4) setError('Please upload at least 4 images');
      return updated;
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError('Video must be under 50MB'); return; }
    if (video?.preview) URL.revokeObjectURL(video.preview);
    setVideo({ file, preview: URL.createObjectURL(file), name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) });
    setError('');
  };

  const removeVideo = () => setVideo(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) { setError('Please select a main category'); return; }
    if (!selectedCategory) { setError('Please select a sub category'); return; }
    if (!formData.title) { setError('Please enter a title'); return; }
    if (!formData.description) { setError('Please enter a description'); return; }
    if (!formData.location) { setError('Please select your location'); return; }
    if (!formData.phone) { setError('Please enter your phone number'); return; }
    if (!formData.pricePerDay) { setError('Please specify rental price per day'); return; }
    if (!formData.coordinates?.lat || !formData.coordinates?.lng) { setError('Please select your location on the map'); return; }
    if (formData.title.length < 5) { setError('Title must be at least 5 characters'); return; }
    if (formData.description.length < 20) { setError('Description must be at least 20 characters'); return; }
    if (images.length < 4) { setError('Please upload at least 4 images'); return; }

    setError('');
    setLoading(true);
    try {
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadToCloudinary(img.file, 'image');
        imageUrls.push(url);
      }
      const videoUrl = video?.file ? await uploadToCloudinary(video.file, 'video') : '';

      const payload = {
        title: formData.title,
        description: formData.description,
        priceAmount: formData.pricePerDay,
        pricePeriod: 'daily',
        product: selectedProduct._id,
        category: selectedCategory._id || selectedCategory.id,
        location: formData.location,
        city: coordinates?.address || '',
        state: coordinates?.city || '',
        pincode: formData.pincode || '',
        phone: formData.phone,
        email: formData.email || 'optional',
        serviceRadius: formData.serviceRadius || 7,
        coordinates: { lat: formData.coordinates.lat, lng: formData.coordinates.lng },
        images: imageUrls.map((url, index) => ({ url, publicId: '', isPrimary: index === 0 })),
        video: videoUrl ? { url: videoUrl, publicId: '' } : null,
      };

      const response = await apiService.createRentalListing(payload);
      if (response.success) {
        alert('Listing submitted! It will be reviewed before going live.');
        navigate('/dashboard');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center px-4 font-sans">
        <Card className="p-8 md:p-10 text-center max-w-md w-full rounded-3xl shadow-sm border border-gray-100 bg-white">
          <div className="w-16 h-16 mx-auto mb-5 bg-orange-50 rounded-full flex items-center justify-center">
            <PackagePlus size={32} className="text-[#fc8019]" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Login Required</h2>
          <p className="text-gray-500 mb-8 font-medium">Please login to list your item for rent</p>
          <Button onClick={() => navigate('/login')} className="w-full bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 text-base text-white">
            Login to Continue
          </Button>
        </Card>
      </div>
    );
  }

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center px-4">
        <div className="p-12 text-center bg-white rounded-3xl shadow-sm max-w-sm w-full">
          <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce"></div>
          <h2 className="text-xl font-extrabold mb-2 text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5] py-6 md:py-10 px-4 md:px-8 pb-24 md:pb-12 font-sans">
      <div className="max-w-[800px] mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#fc8019] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">Post New Ad</h1>
          <div className="w-10" />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-red-800 text-sm font-bold mb-0.5">Action Required</h4>
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-8">

          {/* ── Category Selectors ── */}
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-4 tracking-tight">Category <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Main Category Dropdown */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowProductDropdown(p => !p); setShowCategoryDropdown(false); }}
                  className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all ${selectedProduct ? 'border-[#fc8019] text-gray-800' : 'border-gray-200 text-gray-400'} focus:outline-none`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedProduct ? (
                      <>
                        {selectedProduct.images?.[0]?.url && (
                          <img src={selectedProduct.images[0].url} alt="" className="w-5 h-5 object-contain rounded" />
                        )}
                        {selectedProduct.name}
                      </>
                    ) : 'Select main category...'}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProductDropdown && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#fc8019]"
                          autoFocus
                        />
                      </div>
                    </div>
                    {/* List */}
                    <div className="max-h-56 overflow-y-auto">
                      {productsLoading ? (
                        <div className="py-6 text-center text-sm text-gray-400 font-bold">Loading...</div>
                      ) : products.length > 0 ? (
                        products.map(product => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left ${selectedProduct?._id === product._id ? 'bg-orange-50' : ''}`}
                          >
                            {product.images?.[0]?.url ? (
                              <img src={product.images[0].url} alt="" className="w-8 h-8 object-contain rounded-lg bg-gray-50 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                <PackageSearch size={14} className="text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm font-bold text-gray-800">{product.name}</span>
                            {selectedProduct?._id === product._id && <Check size={14} className="text-[#fc8019] ml-auto shrink-0" />}
                          </button>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-gray-400 font-bold">No categories found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub Category Dropdown */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                  Sub Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  disabled={!selectedProduct}
                  onClick={() => { setShowCategoryDropdown(p => !p); setShowProductDropdown(false); }}
                  className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all ${!selectedProduct ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' : selectedCategory ? 'border-[#fc8019] text-gray-800' : 'border-gray-200 text-gray-400'} focus:outline-none`}
                >
                  <span className="truncate">
                    {!selectedProduct ? 'Select main category first' : selectedCategory ? selectedCategory.name : 'Select sub category...'}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCategoryDropdown && selectedProduct && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {categoriesLoadingState ? (
                        <div className="py-6 text-center text-sm text-gray-400 font-bold">Loading...</div>
                      ) : productCategories.length > 0 ? (
                        productCategories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left ${selectedCategory?.id === cat.id ? 'bg-orange-50' : ''}`}
                          >
                            {cat.image ? (
                              <img src={cat.image} alt="" className="w-8 h-8 object-contain rounded-lg bg-gray-50 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                <PackageSearch size={14} className="text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                            {selectedCategory?.id === cat.id && <Check size={14} className="text-[#fc8019] ml-auto shrink-0" />}
                          </button>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-gray-400 font-bold">No sub categories found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selection confirmation pills */}
            {(selectedProduct || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {selectedProduct && (
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#fc8019] text-xs font-extrabold px-3 py-1.5 rounded-full border border-orange-100">
                    <Check size={11} strokeWidth={3} /> {selectedProduct.name}
                  </span>
                )}
                {selectedCategory && (
                  <>
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#fc8019] text-xs font-extrabold px-3 py-1.5 rounded-full border border-orange-100">
                      <Check size={11} strokeWidth={3} /> {selectedCategory.name}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* ── Core Details ── */}
          <div className="space-y-5">
            <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">Item Details</h3>

            <div>
              <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Canon EOS R6 Camera Body"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe your item's features, included accessories, and condition..."
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all resize-none leading-relaxed"
                required
              />
              <p className="text-[10px] text-gray-400 font-bold mt-1.5 text-right">Min 20 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                  Rental Price Per Day (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-extrabold">₹</span>
                  <input
                    type="number"
                    name="pricePerDay"
                    value={formData.pricePerDay}
                    onChange={handleChange}
                    placeholder="500"
                    className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all appearance-none cursor-pointer"
                >
                  <option value="new">New (Unused)</option>
                  <option value="excellent">Excellent (Like New)</option>
                  <option value="good">Good (Minor wear)</option>
                  <option value="fair">Fair (Visible wear)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 9876543210"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                required
              />
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* ── Location ── */}
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-4 tracking-tight flex items-center gap-2">
              <MapPin size={20} className="text-[#fc8019]" />
              Service Area Configuration
            </h3>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-200 mb-5 overflow-hidden">
              <SellerLocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={coordinates}
                radiusKm={formData.serviceRadius || 7}
                serviceRadius={formData.serviceRadius || 7}
                onRadiusChange={(radius) => setFormData(prev => ({ ...prev, serviceRadius: radius }))}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-1">Service Radius Limit</label>
                  <p className="text-xs font-medium text-gray-500">How far are you willing to provide the item?</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <input
                    type="number"
                    min="1" max="50"
                    value={formData.serviceRadius}
                    onChange={(e) => {
                      const radius = parseInt(e.target.value);
                      if (!isNaN(radius) && radius > 0 && radius <= 50) {
                        setFormData(prev => ({ ...prev, serviceRadius: radius }));
                      } else if (e.target.value === '') {
                        setFormData(prev => ({ ...prev, serviceRadius: '' }));
                      }
                    }}
                    className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fc8019] focus:outline-none text-sm font-extrabold text-center text-[#fc8019]"
                    placeholder="7"
                  />
                  <span className="text-xs font-extrabold text-gray-500 pr-3 uppercase">KM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* ── Media ── */}
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-5 tracking-tight flex items-center gap-2">
              <Upload size={20} className="text-[#fc8019]" />
              Media Uploads
            </h3>

            {/* Images */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  {images.length}/4+ Required
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={image.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button type="button" onClick={() => removeImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110">
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white text-[9px] font-extrabold uppercase px-2 py-1 rounded-md">Cover</div>
                    )}
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#fc8019] hover:bg-orange-50 transition-all group">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Upload className="text-gray-400 group-hover:text-[#fc8019]" size={20} />
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider group-hover:text-[#fc8019]">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Video */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">
                  Product Video <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Max 50MB</span>
              </div>
              {!video ? (
                <label className="w-full h-32 md:h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#fc8019] hover:bg-orange-50 transition-all group bg-gray-50">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="text-gray-400 group-hover:text-[#fc8019]" size={24} />
                  </div>
                  <span className="text-xs font-extrabold text-gray-700 mb-1">Click to Upload Video</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Required for verification</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                  <video src={video.preview} className="w-full h-40 md:h-56 object-contain" controls />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                    <div className="text-white font-bold text-sm mb-3 px-4 text-center">{video.name}</div>
                    <div className="text-gray-300 font-extrabold text-xs uppercase bg-black/50 px-3 py-1 rounded-full mb-4">{video.size} MB</div>
                    <button type="button" onClick={removeVideo} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-red-600 flex items-center gap-1 pointer-events-auto">
                      <X size={14} strokeWidth={3} /> Remove Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="pt-6 border-t border-gray-100">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fc8019] hover:bg-orange-600 py-4 text-base font-extrabold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed border-none rounded-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Ad...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Post Rental Ad</span>
                  <ChevronRight size={18} strokeWidth={3} />
                </div>
              )}
            </Button>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-wider">
              By posting, you agree to our Terms of Service
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PostAd;