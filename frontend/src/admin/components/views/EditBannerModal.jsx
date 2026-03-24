import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import apiService from '../../../services/api';

const EditBannerModal = ({ isOpen, onClose, onBannerUpdated, banner }) => {
  const [formData, setFormData] = useState({
    title: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  // Initialize form data when banner changes
  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        image: null
      });
      setImagePreview(banner.banner || null);
    }
  }, [banner]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    console.log('Image change triggered:', e.target.files);
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
      console.log('Image set in form data');
    } else {
      console.log('No file selected');
      setFormData(prev => ({ ...prev, image: null }));
      setImagePreview(banner?.banner || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Banner title is required');
      }

      console.log('Updating banner data:', formData);

      // Create data object for API call
      const submitData = {
        title: formData.title,
        ...(formData.image && { image: formData.image }) // Only include image if a new one is selected
      };

      console.log('Submit data for update:', submitData);
      console.log('Form data image:', formData.image);
      console.log('Banner ID:', banner._id);

      const response = await apiService.updateBanner(banner._id, submitData);
      
      console.log('Banner updated successfully:', response);
      console.log('Updated banner data:', response.data);
      
      // Notify parent component
      onBannerUpdated(response.data);
      handleClose();
    } catch (err) {
      console.error('Error updating banner:', err);
      setError(err.message || 'Failed to update banner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        image: null
      });
      setImagePreview(null);
      setError('');
      onClose();
    }
  };

  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Banner</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Banner Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter banner title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg relative">
              {imagePreview ? (
                <div className="relative w-full h-48 flex items-center justify-center">
                  <img src={imagePreview} alt="Banner Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('file-upload-edit').click();
                      }}
                      className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                      title="Change Image"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, image: null }));
                        setImagePreview(banner?.banner || null);
                      }}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove Image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    id="file-upload-edit"
                    name="image"
                    type="file"
                    className="sr-only"
                    onChange={handleImageChange}
                    accept="image/*"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="image"
                        type="file"
                        className="sr-only"
                        onChange={handleImageChange}
                        accept="image/*"
                        disabled={loading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep the current image, or upload a new one to replace it.
              {formData.image && (
                <span className="block text-green-600 font-medium mt-1">
                  ✓ New image selected: {formData.image.name}
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Update Banner</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBannerModal;
