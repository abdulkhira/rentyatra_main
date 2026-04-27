import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Image as ImageIcon, Loader2,
    X, Upload, Package, CheckCircle, AlertCircle,
    Download // Added Download icon
} from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';

const CategoriesManagementView = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { adminToken } = useAdminAuth();

    // ... existing state for forms ...
    const [formData, setFormData] = useState({ name: '' });
    const [editFormData, setEditFormData] = useState({ name: '' });
    const [images, setImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [editImages, setEditImages] = useState([]);
    const [editImagePreview, setEditImagePreview] = useState([]);

    useEffect(() => {
        if (adminToken) {
            apiService.setAdminToken(adminToken);
        }
    }, [adminToken]);

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

    // --- NEW: CSV EXPORT FUNCTION ---
    const handleExportCSV = () => {
        if (products.length === 0) {
            alert("No data available to export");
            return;
        }

        // Define headers
        const headers = ["Name", "Status", "Manager", "Created At"];

        // Map data to rows
        const rows = products.map(product => [
            `"${product.name}"`, // Wrap in quotes to handle commas in names
            product.status || 'Active',
            `"${product.addedBy?.name || 'Super Admin'}"`,
            new Date(product.createdAt).toLocaleDateString()
        ]);

        // Combine into string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `categories_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ... handleImageUpload, handleEditProduct, handleSubmit, handleEditSubmit, handleDeleteProduct (no changes) ...

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
        <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categories</h1>
                    <p className="text-slate-500 font-medium">Organize your rental inventory</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* CSV Export Button */}
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>

                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Plus className="w-5 h-5" />
                        New Category
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {/* List Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">All Categories ({products.length})</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest">Category Detail</th>
                                <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest">Manager</th>
                                <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && products.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : products.map((product) => (
                                <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                                {product.images?.[0]?.url ? (
                                                    <img src={product.images[0].url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-800">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {product.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sl font-medium text-slate-500">{product.addedBy?.name || 'Super Admin'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEditProduct(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteProduct(product)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Components */}
            {/* ... Modal Logic remains exactly same ... */}
            {/* Add Product Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Add New Category</h2>
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
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter Category name"
                                />
                            </div>

                            {/* Product Images */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Category Images
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
                                    {loading ? 'Adding...' : 'Add Category'}
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
                                <h2 className="text-2xl font-bold text-slate-800">Edit Category</h2>
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
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter Category name"
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
                                    {loading ? 'Updating...' : 'Update Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesManagementView;