import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

function EditBoostOrderModal({ isOpen, onClose, boostOrder, onSave }) {
  const [formData, setFormData] = useState({
    status: 'active',
    usedBoosts: 0,
    remainingBoosts: 0
  });
  const [loading, setLoading] = useState(false);

  // Helper function to format user ID (same as user account section)
  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    // Format: USR + last 4 characters (same as user account section)
    return `USR${String(userId).slice(-4).padStart(4, '0')}`;
  };

  // Helper function to get plan display name
  const getPlanDisplayName = (packageName) => {
    if (!packageName) return 'Unknown Plan';
    
    // Extract plan type from package name
    if (packageName.includes('Quick')) return 'Quick Boost';
    if (packageName.includes('Power')) return 'Power Boost';
    if (packageName.includes('Mega')) return 'Mega Boost';
    
    return packageName;
  };

  useEffect(() => {
    if (boostOrder) {
      setFormData({
        status: boostOrder.status || 'active',
        usedBoosts: boostOrder.usedBoosts || 0,
        remainingBoosts: boostOrder.remainingBoosts || 0
      });
    }
  }, [boostOrder]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(boostOrder._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating boost order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !boostOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Edit Boost Order</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* User Info */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <h3 className="text-xs font-medium text-slate-600 mb-2">User Information</h3>
            <div className="text-xs text-slate-800">
              <p><strong>Name:</strong> {boostOrder.userId?.name || 'Unknown User'}</p>
              <p><strong>Email:</strong> {boostOrder.userId?.email || 'No Email'}</p>
              <p><strong>Phone:</strong> {boostOrder.userId?.phone || 'No Phone'}</p>
              <p><strong>User ID:</strong> 
                <span 
                  className="font-mono text-xs cursor-pointer hover:text-blue-600 transition-colors ml-1"
                  title={`Click to copy full User ID: ${boostOrder.userId?._id || 'N/A'}`}
                  onClick={() => {
                    if (boostOrder.userId?._id) {
                      navigator.clipboard.writeText(boostOrder.userId._id);
                      alert('User ID copied to clipboard!');
                    }
                  }}
                >
                  {formatUserId(boostOrder.userId?._id)}
                </span>
              </p>
            </div>
          </div>

          {/* Package Info */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <h3 className="text-xs font-medium text-slate-600 mb-2">Package Information</h3>
            <div className="text-xs text-slate-800">
              <p><strong>Package:</strong> {getPlanDisplayName(boostOrder.packageName)}</p>
              <p><strong>Total Boosts:</strong> {boostOrder.boostCount}</p>
              <p><strong>Price:</strong> ₹{boostOrder.totalAmount || boostOrder.price}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Used Boosts */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Used Boosts
              </label>
              <input
                type="number"
                name="usedBoosts"
                value={formData.usedBoosts}
                onChange={handleInputChange}
                min="0"
                max={boostOrder.boostCount}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Remaining Boosts */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remaining Boosts
              </label>
              <input
                type="number"
                name="remainingBoosts"
                value={formData.remainingBoosts}
                onChange={handleInputChange}
                min="0"
                max={boostOrder.boostCount}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Validation Warning */}
            {formData.usedBoosts + formData.remainingBoosts !== boostOrder.boostCount && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Used + Remaining should equal total boosts ({boostOrder.boostCount})
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.usedBoosts + formData.remainingBoosts !== boostOrder.boostCount}
                className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditBoostOrderModal;
