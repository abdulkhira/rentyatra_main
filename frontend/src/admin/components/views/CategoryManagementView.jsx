import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';

const CategoryManagementView = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categories, setCategories] = useState([]);
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
        productId: ''
    });

    const [categoryFields, setCategoryFields] = useState([
        {
            id: 1,
            name: '',
            images: [],
            imagePreview: []
        }
    ]);

    const [editFormData, setEditFormData] = useState({
        name: ''
    });

    const [editImages, setEditImages] = useState([]);
    const [editImagePreview, setEditImagePreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllCategories(); // Get all categories (default limit is now 100)
            setCategories(response.data.categories);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products for dropdown
    const fetchProducts = async () => {
        try {
            const response = await apiService.getAllProducts(1, 100); // Get all products
            setProducts(response.data.products);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    useEffect(() => {
        fetchCategories();
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

    // Handle category name change
    const handleCategoryNameChange = (categoryId, value) => {
        setCategoryFields(prev => prev.map(cat => 
            cat.id === categoryId ? { ...cat, name: value } : cat
        ));

        // Clear validation error for this field
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[categoryId];
            return newErrors;
        });
    };

    // Validate individual category field
    const validateCategoryField = (categoryId, name) => {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return 'Category name is required';
        }
        if (trimmedName.length < 2) {
            return 'Category name must be at least 2 characters long';
        }
        return null;
    };

    // Handle category image upload
    const handleCategoryImageUpload = (categoryId, e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        
        setCategoryFields(prev => prev.map(cat => 
            cat.id === categoryId ? { 
                ...cat, 
                images: files, 
                imagePreview: previews 
            } : cat
        ));
    };

    // Add new category field
    const addCategoryField = () => {
        const newId = Math.max(...categoryFields.map(cat => cat.id)) + 1;
        setCategoryFields(prev => [...prev, {
            id: newId,
            name: '',
            images: [],
            imagePreview: []
        }]);
    };

    // Remove category field
    const removeCategoryField = (categoryId) => {
        if (categoryFields.length > 1) {
            setCategoryFields(prev => prev.filter(cat => cat.id !== categoryId));
        }
    };

    // Handle edit input changes
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit image upload
    const handleEditImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setEditImages(files);
        
        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setEditImagePreview(previews);
    };

    // Open edit modal
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setEditFormData({
            name: category.name
        });
        setEditImages([]);
        setEditImagePreview([]);
        setShowEditForm(true);
    };

    // Close edit modal
    const handleCloseEditForm = () => {
        setShowEditForm(false);
        setEditingCategory(null);
        setEditFormData({ name: '' });
        setEditImages([]);
        setEditImagePreview([]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form data
            if (!formData.productId) {
                throw new Error('Product selection is required');
            }

            // Validate categories
            const validCategories = categoryFields.filter(cat => cat.name.trim());
            if (validCategories.length === 0) {
                throw new Error('At least one category name is required');
            }

            // Validate each category name length and set validation errors
            const errors = {};
            for (const category of validCategories) {
                const error = validateCategoryField(category.id, category.name);
                if (error) {
                    errors[category.id] = error;
                }
            }

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                throw new Error('Please fix the validation errors before submitting');
            }

            // Check for duplicate category names
            const categoryNames = validCategories.map(cat => cat.name.trim().toLowerCase());
            const uniqueNames = new Set(categoryNames);
            if (categoryNames.length !== uniqueNames.size) {
                throw new Error('Category names must be unique');
            }

            // Submit each category
            const results = [];
            for (const category of validCategories) {
                const categoryData = {
                    productId: formData.productId,
                    name: category.name.trim(),
                    images: category.images
                };

                console.log('Submitting category data:', categoryData);
                console.log('Admin token available:', !!adminToken);
                console.log('API service admin token:', apiService.adminToken);
                
                try {
                    const result = await apiService.addCategory(categoryData);
                    results.push(result);
                    console.log('Category added successfully:', result);
                } catch (categoryError) {
                    console.error('Error adding individual category:', categoryError);
                    throw categoryError; // Re-throw to stop the loop
                }
            }

            // Reset form
            setFormData({
                productId: ''
            });
            setCategoryFields([{
                id: 1,
                name: '',
                images: [],
                imagePreview: []
            }]);
            setValidationErrors({});
            setShowAddForm(false);
            
            // Refresh categories list
            await fetchCategories();
            
        } catch (err) {
            console.error('Error adding categories:', err);
            setError(err.message || 'Failed to add categories. Please try again.');
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
                throw new Error('Category name is required');
            }

            // Prepare category data
            const categoryData = {
                name: editFormData.name.trim(),
                images: editImages
            };

            console.log('Updating category:', editingCategory._id, categoryData);
            const result = await apiService.updateCategory(editingCategory._id, categoryData);
            console.log('Category updated successfully:', result);

            // Close edit form
            handleCloseEditForm();
            
            // Refresh categories list
            await fetchCategories();
            
        } catch (err) {
            console.error('Error updating category:', err);
            setError(err.message || 'Failed to update category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete category
    const handleDeleteCategory = async (category) => {
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Deleting category:', category._id);
            await apiService.deleteCategory(category._id);
            console.log('Category deleted successfully');

            // Refresh categories list
            await fetchCategories();
            
        } catch (err) {
            console.error('Error deleting category:', err);
            setError(err.message || 'Failed to delete category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Category Management</h1>
                    <p className="text-slate-600 mt-1">Manage product categories and their images</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                    Add Category
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Categories List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Categories</h2>
                    
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📂</div>
                            <h3 className="text-lg font-medium text-slate-700 mb-2">No categories found</h3>
                            <p className="text-slate-500">Start by adding your first category.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Category
                                        </th>
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
                                    {categories.map((category) => (
                                        <tr key={category._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {category.images && category.images.length > 0 ? (
                                                            <img
                                                                className="h-12 w-12 rounded-lg object-cover"
                                                                src={category.images[0].url}
                                                                alt={category.name}
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
                                                            {category.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {category.product?.name || 'Unknown Product'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    category.status === 'active' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : category.status === 'inactive'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {category.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {category.addedBy?.name || 'Admin'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCategory(category)}
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
            </div>

            {/* Add Category Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
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
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Product *
                                </label>
                                <select
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Choose a product</option>
                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Categories Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Categories *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addCategoryField}
                                        className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Category
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {categoryFields.map((category, index) => (
                                        <div key={category.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-medium text-slate-700">
                                                    Category {index + 1}
                                                </h4>
                                                {categoryFields.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCategoryField(category.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {/* Category Name */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                                    Category Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={category.name}
                                                    onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                                                        validationErrors[category.id] 
                                                            ? 'border-red-300 focus:ring-red-500' 
                                                            : 'border-slate-300 focus:ring-blue-500'
                                                    }`}
                                                    placeholder="Enter category name (min 2 characters)"
                                                />
                                                {validationErrors[category.id] && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {validationErrors[category.id]}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Category Images */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                                    Category Images
                                                </label>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => handleCategoryImageUpload(category.id, e)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                
                                                {category.imagePreview.length > 0 && (
                                                    <div className="mt-3 grid grid-cols-4 gap-3">
                                                        {category.imagePreview.map((preview, imgIndex) => (
                                                            <div key={imgIndex} className="relative">
                                                                <img
                                                                    src={preview}
                                                                    alt={`Preview ${imgIndex + 1}`}
                                                                    className="w-full h-20 object-cover rounded-lg"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setFormData({ productId: '' });
                                        setCategoryFields([{
                                            id: 1,
                                            name: '',
                                            images: [],
                                            imagePreview: []
                                        }]);
                                        setValidationErrors({});
                                    }}
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

            {/* Edit Category Modal */}
            {showEditForm && editingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
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
                            {/* Product Info (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product
                                </label>
                                <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                                    {editingCategory.product?.name || 'Unknown Product'}
                                </div>
                            </div>

                            {/* Category Name */}
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
                                    placeholder="Enter category name"
                                />
                            </div>

                            {/* Current Images */}
                            {editingCategory.images && editingCategory.images.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Current Images
                                    </label>
                                    <div className="grid grid-cols-4 gap-4">
                                        {editingCategory.images.map((image, index) => (
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

                            {/* New Category Images */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    New Category Images (will replace current images)
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

export default CategoryManagementView;
