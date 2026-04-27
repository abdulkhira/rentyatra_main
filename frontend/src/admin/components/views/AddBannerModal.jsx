import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import apiService from '../../../services/api';

const AddBannerModal = ({ isOpen, onClose, onBannerAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Banner title is required');
      }
      if (!formData.image) {
        throw new Error('Banner image is required');
      }

      const submitData = {
        title: formData.title,
        image: formData.image
      };

      const response = await apiService.addBanner(submitData);

      // Reset form
      setFormData({
        title: '',
        image: null
      });
      setImagePreview(null);

      // Notify parent component
      onBannerAdded(response.data);

      // Close modal
      onClose();

    } catch (error) {
      console.error('Error adding banner:', error);
      setError(error.message || 'Failed to add banner');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <ImageIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add New Banner</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Hero Section Media</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-3 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-1">
          <form id="banner-form" onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <p className="text-rose-700 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Banner Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1 block">
                Banner Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Summer Furniture Sale"
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                required
                disabled={loading}
              />
            </div>

            {/* Banner Image Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1 block">
                Banner Image <span className="text-rose-500">*</span>
              </label>

              {!imagePreview ? (
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    id="banner-image"
                    disabled={loading}
                  />
                  <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all duration-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700">
                      Drag & Drop or <span className="text-indigo-600">Click to Upload</span>
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                      PNG, JPG, GIF (Max 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-64 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner group">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white/90 backdrop-blur-md text-slate-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-lg">
                      <RefreshCw className="w-4 h-4" />
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="banner-form"
            disabled={loading || !formData.title.trim() || !formData.image}
            className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Upload Banner</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddBannerModal;