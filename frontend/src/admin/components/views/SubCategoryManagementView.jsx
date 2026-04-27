import { useState, useEffect, useMemo } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';

export default function SubCategoryManagementView() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { adminToken } = useAdminAuth();

    // New State for Search and Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');

    useEffect(() => {
        if (adminToken) {
            apiService.setAdminToken(adminToken);
        }
    }, [adminToken]);

    const [formData, setFormData] = useState({ productId: '' });
    const [categoryFields, setCategoryFields] = useState([{ id: 1, name: '', images: [], imagePreview: [] }]);
    const [editFormData, setEditFormData] = useState({ name: '' });
    const [editImages, setEditImages] = useState([]);
    const [editImagePreview, setEditImagePreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllCategories();
            setCategories(response.data.categories);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await apiService.getAllProducts(1, 100);
            setProducts(response.data.products);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    // --- Search & Filter Logic ---
    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter ? category.status === statusFilter : true;
            const matchesProduct = productFilter ? category.product?._id === productFilter : true;
            return matchesSearch && matchesStatus && matchesProduct;
        });
    }, [categories, searchQuery, statusFilter, productFilter]);

    // --- CSV Export Logic ---
    const exportToCSV = () => {
        const headers = ['Sub Category Name', 'Product', 'Status', 'Added By'];
        const csvData = filteredCategories.map(cat => [
            cat.name,
            cat.product?.name || 'Unknown',
            cat.status || 'active',
            cat.addedBy?.name || 'Admin'
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sub_categories_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryNameChange = (categoryId, value) => {
        setCategoryFields(prev => prev.map(cat => cat.id === categoryId ? { ...cat, name: value } : cat));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[categoryId];
            return newErrors;
        });
    };

    const validateCategoryField = (categoryId, name) => {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) return 'Category name is required';
        if (trimmedName.length < 2) return 'Category name must be at least 2 characters long';
        return null;
    };

    const handleCategoryImageUpload = (categoryId, e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        setCategoryFields(prev => prev.map(cat =>
            cat.id === categoryId ? { ...cat, images: files, imagePreview: previews } : cat
        ));
    };

    const addCategoryField = () => {
        const newId = Math.max(...categoryFields.map(cat => cat.id), 0) + 1;
        setCategoryFields(prev => [...prev, { id: newId, name: '', images: [], imagePreview: [] }]);
    };

    const removeCategoryField = (categoryId) => {
        if (categoryFields.length > 1) {
            setCategoryFields(prev => prev.filter(cat => cat.id !== categoryId));
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setEditImages(files);
        setEditImagePreview(files.map(file => URL.createObjectURL(file)));
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setEditFormData({ name: category.name });
        setEditImages([]);
        setEditImagePreview([]);
        setShowEditForm(true);
    };

    const handleCloseEditForm = () => {
        setShowEditForm(false);
        setEditingCategory(null);
        setEditFormData({ name: '' });
        setEditImages([]);
        setEditImagePreview([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.productId) throw new Error('Product selection is required');

            const validCategories = categoryFields.filter(cat => cat.name.trim());
            if (validCategories.length === 0) throw new Error('At least one category name is required');

            const errors = {};
            for (const category of validCategories) {
                const error = validateCategoryField(category.id, category.name);
                if (error) errors[category.id] = error;
            }

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                throw new Error('Please fix the validation errors before submitting');
            }

            const categoryNames = validCategories.map(cat => cat.name.trim().toLowerCase());
            if (categoryNames.length !== new Set(categoryNames).size) {
                throw new Error('Category names must be unique');
            }

            for (const category of validCategories) {
                await apiService.addCategory({
                    productId: formData.productId,
                    name: category.name.trim(),
                    images: category.images
                });
            }

            setFormData({ productId: '' });
            setCategoryFields([{ id: 1, name: '', images: [], imagePreview: [] }]);
            setValidationErrors({});
            setShowAddForm(false);
            await fetchCategories();

        } catch (err) {
            setError(err.message || 'Failed to add categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!editFormData.name.trim()) throw new Error('Category name is required');

            await apiService.updateCategory(editingCategory._id, {
                name: editFormData.name.trim(),
                images: editImages
            });

            handleCloseEditForm();
            await fetchCategories();
        } catch (err) {
            setError(err.message || 'Failed to update category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;

        setLoading(true);
        setError('');
        try {
            await apiService.deleteCategory(category._id);
            await fetchCategories();
        } catch (err) {
            setError(err.message || 'Failed to delete category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Sub Categories</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your product sub-categories and image assets.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={exportToCSV}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md transition-all font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Category
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Filters & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                </div>
                <div className="flex gap-4 md:w-auto w-full">
                    <select
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        className="flex-1 md:w-48 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    >
                        <option value="">All Products</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 md:w-40 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-slate-500 font-medium">Loading categories...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No categories found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            {searchQuery || productFilter || statusFilter
                                ? "We couldn't find anything matching your filters. Try adjusting them."
                                : "Start building your catalog by adding your first sub-category."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-2xl">Category</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Product</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added By</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.map((category) => (
                                    <tr key={category._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                                    {category.images && category.images.length > 0 ? (
                                                        <img src={category.images[0].url} alt={category.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-slate-800">{category.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {category.product?.name || <span className="text-slate-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                                ${category.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : category.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${category.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                {category.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {category.addedBy?.name || 'System Admin'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditCategory(category)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteCategory(category)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Add New Sub Category</h2>
                            <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 flex-1">
                            <form id="add-category-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Parent Product <span className="text-red-500">*</span></label>
                                    <select
                                        name="productId"
                                        value={formData.productId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Choose a Product</option>
                                        {products.map(product => (
                                            <option key={product._id} value={product._id}>{product.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-semibold text-slate-700">Sub Categories Configuration</label>
                                        <button type="button" onClick={addCategoryField} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Add Another
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {categoryFields.map((category, index) => (
                                            <div key={category.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm relative group transition-all hover:border-blue-200">
                                                {categoryFields.length > 1 && (
                                                    <button type="button" onClick={() => removeCategoryField(category.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}

                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Entry #{index + 1}</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">Category Name <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            value={category.name}
                                                            onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                                                            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${validationErrors[category.id] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                                            placeholder="e.g. Office Chairs"
                                                        />
                                                        {validationErrors[category.id] && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> {validationErrors[category.id]}</p>}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">Images</label>
                                                        <div className="relative">
                                                            <input type="file" multiple accept="image/*" onChange={(e) => handleCategoryImageUpload(category.id, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                            <div className="w-full px-4 py-2.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center gap-2 text-slate-500 text-sm">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                <span>Click or drag to upload</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {category.imagePreview.length > 0 && (
                                                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                                                        {category.imagePreview.map((preview, imgIndex) => (
                                                            <div key={imgIndex} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                                                <img src={preview} alt={`Preview ${imgIndex}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                            <button form="add-category-form" type="submit" disabled={loading} className="px-5 py-2.5 font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                {loading ? 'Saving...' : 'Save Categories'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {showEditForm && editingCategory && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Edit Sub Category</h2>
                            <button onClick={handleCloseEditForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <form id="edit-category-form" onSubmit={handleEditSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Product</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium">
                                        {editingCategory.product?.name || 'Unknown Product'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditInputChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-slate-700">Images</label>
                                    {editingCategory.images && editingCategory.images.length > 0 && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Current Images</p>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {editingCategory.images.map((image, index) => (
                                                    <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                        <img src={image.url} alt={`Current ${index}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="relative">
                                            <input type="file" multiple accept="image/*" onChange={handleEditImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="w-full px-4 py-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-slate-600 font-medium text-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                <span>Upload New Images (Replaces Current)</span>
                                            </div>
                                        </div>

                                        {editImagePreview.length > 0 && (
                                            <div className="mt-4 flex gap-3 overflow-x-auto">
                                                {editImagePreview.map((preview, index) => (
                                                    <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border border-blue-200 ring-2 ring-blue-100 flex-shrink-0">
                                                        <img src={preview} alt={`New Preview ${index}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseEditForm} className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                            <button form="edit-category-form" type="submit" disabled={loading} className="px-5 py-2.5 font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                {loading ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}