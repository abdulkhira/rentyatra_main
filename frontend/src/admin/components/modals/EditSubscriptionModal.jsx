import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const EditSubscriptionModal = ({ isOpen, onClose, subscription, onSave }) => {
  const [formData, setFormData] = useState({
    maxListings: 0,
    currentListings: 0,
    status: 'active',
    endDate: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subscription && isOpen) {
      setFormData({
        maxListings: subscription.maxListings || 0,
        currentListings: subscription.currentListings || 0,
        status: subscription.status || 'active',
        endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : ''
      });
    }
  }, [subscription, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'endDate') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.maxListings < 0) {
      newErrors.maxListings = 'Max Listings cannot be negative';
    }
    if (formData.currentListings < 0) {
      newErrors.currentListings = 'Current Listings cannot be negative';
    }
    if (formData.currentListings > formData.maxListings && formData.maxListings !== -1) {
      newErrors.currentListings = 'Current Listings cannot exceed Max Listings';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedData = {
        ...subscription,
        ...formData,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : subscription.endDate
      };
      
      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Edit Subscription Limits</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">User Name</label>
                <p className="text-gray-900 font-medium">{subscription?.userId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Plan Name</label>
                <p className="text-gray-900 font-medium">{subscription?.planName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Plan Limits & Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Plan Limits & Usage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Listings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Listings
                </label>
                <input
                  type="number"
                  name="maxListings"
                  value={formData.maxListings}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxListings ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter max listings (-1 for unlimited)"
                />
                {errors.maxListings && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.maxListings}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited listings</p>
              </div>

              {/* Current Listings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Listings
                </label>
                <input
                  type="number"
                  name="currentListings"
                  value={formData.currentListings}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.currentListings ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter current listings"
                />
                {errors.currentListings && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.currentListings}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
};

export default EditSubscriptionModal;
