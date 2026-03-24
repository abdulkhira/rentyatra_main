import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

function EditPlanModal({ isOpen, onClose, plan, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    duration: 30,
    features: [],
    maxListings: 0,
    maxPhotos: 0,
    gradient: 'from-gray-400 to-gray-500',
    popular: false
  });
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const gradientOptions = [
    { value: 'from-gray-400 to-gray-500', label: 'Gray', preview: 'bg-gradient-to-br from-gray-400 to-gray-500' },
    { value: 'from-blue-500 to-indigo-600', label: 'Blue', preview: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { value: 'from-purple-500 to-pink-600', label: 'Purple', preview: 'bg-gradient-to-br from-purple-500 to-pink-600' },
    { value: 'from-green-500 to-emerald-600', label: 'Green', preview: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { value: 'from-orange-500 to-red-600', label: 'Orange', preview: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { value: 'from-yellow-500 to-orange-600', label: 'Yellow', preview: 'bg-gradient-to-br from-yellow-500 to-orange-600' }
  ];

  useEffect(() => {
    if (plan && isOpen) {
      setFormData({
        id: plan.id || '',
        name: plan.name || '',
        price: plan.price || '',
        duration: plan.duration || 30,
        features: [...(plan.features || [])],
        maxListings: plan.maxListings || 0,
        maxPhotos: plan.maxPhotos || 0,
        gradient: plan.gradient || 'from-gray-400 to-gray-500',
        popular: plan.popular || false
      });
      setErrors({});
    }
  }, [plan, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.features.length === 0) {
      newErrors.features = 'At least one feature is required';
    }
    
    if (formData.maxListings < 0) {
      newErrors.maxListings = 'Max listings cannot be negative';
    }
    
    if (formData.maxPhotos < 0) {
      newErrors.maxPhotos = 'Max photos cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Edit Subscription Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Enter plan name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Enter price"
                min="0"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>

          {/* Duration and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Listings
              </label>
              <input
                type="number"
                name="maxListings"
                value={formData.maxListings}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maxListings ? 'border-red-300' : 'border-slate-300'
                }`}
                min="0"
              />
              {errors.maxListings && <p className="text-red-500 text-sm mt-1">{errors.maxListings}</p>}
            </div>
          </div>

          {/* Gradient Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Plan Color
            </label>
            <div className="grid grid-cols-3 gap-3">
              {gradientOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gradient"
                    value={option.value}
                    checked={formData.gradient === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-full h-12 rounded-lg ${option.preview} ${
                    formData.gradient === option.value ? 'ring-2 ring-blue-500' : ''
                  }`}></div>
                  <span className="text-sm text-slate-600">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Features *
            </label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={handleFeatureKeyPress}
                  placeholder="Add new feature"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
            {errors.features && <p className="text-red-500 text-sm mt-1">{errors.features}</p>}
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="popular"
              checked={formData.popular}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-slate-700">
              Mark as Popular Plan
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPlanModal;
