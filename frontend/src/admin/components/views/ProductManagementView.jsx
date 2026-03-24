import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';

const ProductManagementView = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { adminToken } = useAdminAuth();

    // Set admin token in API service
    useEffect(() => {
        if (adminToken) {
            apiService.setAdminToken(adminToken);
            console.log('Admin token set in API service:', adminToken);
        } else {
            console.warn('No admin token available');
        }
    }, [adminToken]);

    // Form state
    const [formData, setFormData] = useState({
        name: ''
    });

    const [editFormData, setEditFormData] = useState({
        name: ''
    });

    const [images, setImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [editImages, setEditImages] = useState([]);
    const [editImagePreview, setEditImagePreview] = useState([]);

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAllProducts();
            setProducts(data.data.products || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        
        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreview(previews);
    };

    // Handle edit image upload
    const handleEditImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setEditImages(files);
        
        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setEditImagePreview(previews);
    };

    // Handle edit input changes
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Open edit modal
    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setEditFormData({
            name: product.name
        });
        setEditImages([]);
        setEditImagePreview([]);
        setShowEditForm(true);
    };

    // Close edit modal
    const handleCloseEditForm = () => {
        setShowEditForm(false);
        setEditingProduct(null);
        setEditFormData({ name: '' });
        setEditImages([]);
        setEditImagePreview([]);
    };


    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Show progress message
        console.log('Starting product upload...');

        try {
            // Validate form data
            if (!formData.name.trim()) {
                throw new Error('Product name is required');
            }

            // Prepare product data
            const productData = {
                name: formData.name.trim(),
                images: images
            };

            console.log('Submitting product data:', productData);
            const result = await apiService.addProduct(productData);
            console.log('Product added successfully:', result);

            // Reset form
            setFormData({
                name: ''
            });
            setImages([]);
            setImagePreview([]);
            setShowAddForm(false);
            
            // Refresh products list
            await fetchProducts();
            
        } catch (err) {
            console.error('Error adding product:', err);
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Failed to add product. Please try again.';
            
            if (err.message.includes('timeout')) {
                errorMessage = 'Upload timeout - Please try again with smaller files or check your internet connection.';
            } else if (err.message.includes('Network error')) {
                errorMessage = 'Network error - Please check your internet connection and try again.';
            } else if (err.message.includes('Server error')) {
                errorMessage = 'Server error - Please try again later or contact support.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form data
            if (!editFormData.name.trim()) {
                throw new Error('Product name is required');
            }

            // Prepare product data
            const productData = {
                name: editFormData.name.trim(),
                images: editImages
            };

            console.log('Updating product:', editingProduct._id, productData);
            const result = await apiService.updateProduct(editingProduct._id, productData);
            console.log('Product updated successfully:', result);

            // Close edit form
            handleCloseEditForm();
            
            // Refresh products list
            await fetchProducts();
            
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.message || 'Failed to update product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete product
    const handleDeleteProduct = async (product) => {
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Deleting product:', product._id);
            await apiService.deleteProduct(product._id);
            console.log('Product deleted successfully');

            // Refresh products list
            await fetchProducts();
            
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.message || 'Failed to delete product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Product Management</h1>
                    <p className="text-slate-600 mt-2">Manage all products in the system</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">All Products</h2>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-2">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl text-slate-300 mb-4">📦</div>
                        <h3 className="text-lg font-medium text-slate-700 mb-2">No Products Found</h3>
                        <p className="text-slate-500">Start by adding your first product.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Added By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {product.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.status === 'active' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.status === 'inactive'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {product.addedBy?.name || 'Admin'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => handleEditProduct(product)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProduct(product)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Add New Product</h2>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter product name"
                                />
                            </div>

                            {/* Product Images */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Images
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                                {imagePreview.length > 0 && (
                                    <div className="mt-4 grid grid-cols-4 gap-4">
                                        {imagePreview.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {loading ? 'Adding...' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditForm && editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Edit Product</h2>
                                <button
                                    onClick={handleCloseEditForm}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter product name"
                                />
                            </div>

                            {/* Current Images */}
                            {editingProduct.images && editingProduct.images.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Current Images
                                    </label>
                                    <div className="grid grid-cols-4 gap-4">
                                        {editingProduct.images.map((image, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={image.url}
                                                    alt={`Current ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Product Images */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    New Product Images (will replace current images)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleEditImageUpload}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                                {editImagePreview.length > 0 && (
                                    <div className="mt-4 grid grid-cols-4 gap-4">
                                        {editImagePreview.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`New Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseEditForm}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {loading ? 'Updating...' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagementView;
