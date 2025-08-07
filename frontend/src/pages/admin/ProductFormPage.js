import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

const ProductFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    comparePrice: 0,
    costPrice: 0,
    category: '',
    stock: 0,
    lowStockAlert: 5,
    weight: 0,
    status: 'active',
    images: [],
    seoTitle: '',
    seoDescription: ''
  });
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      formData.images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/admin/categories');
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover') {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleImageUpload({ target: { files } });
    }
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Filter out any invalid files and create previews
    const validFiles = files.filter(file => file instanceof Blob);
    
    const newImages = validFiles.map(file => {
      try {
        return {
          file,
          preview: URL.createObjectURL(file)
        };
      } catch (error) {
        console.error('Error creating preview for file:', file.name, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from failed previews
    
    if (newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
    
    // Clear the file input to allow selecting the same file again
    if (e.target) {
      e.target.value = null;
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleImageUpload({ target: { files } });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddNewCategory = async () => {
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;
    
    try {
      setLoading(true);
      console.log('Creating category with name:', categoryName);
      
      if (!user?.token) {
        throw new Error('You need to be logged in to create a category');
      }
      
      // Create the category data object
      const categoryData = {
        name: categoryName,
        status: 'active',
        isActive: true,
        description: '',
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        sortOrder: 0,
        metaTitle: categoryName,
        metaDescription: `${categoryName} category`,
      };
      
      console.log('Sending category data:', categoryData);
      
      // Use the api service which handles auth headers automatically
      const response = await api.post('/admin/categories', categoryData);
      
      console.log('Category creation response:', response);
      
      if (response.status >= 400) {
        throw new Error(response.data?.message || 'Failed to create category');
      }
      
      // The backend returns the category in response.data.category
      if (response.data?.category) {
        const newCategory = response.data.category;
        console.log('New category created:', newCategory);
        
        // Update the categories list with the new category
        setCategories(prev => [...prev, newCategory]);
        
        // Update the form to select the new category
        setFormData(prev => ({
          ...prev,
          category: newCategory._id
        }));
        
        // Reset the new category input
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        setError(''); // Clear any previous errors
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      
      // Log detailed error information
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Set a user-friendly error message
      setError(err.message || 'Failed to create new category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.price === '' || formData.price === null || formData.price === undefined) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Please enter a valid price';
    }
    
    if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
      newErrors.stock = 'Stock quantity is required';
    } else if (isNaN(Number(formData.stock)) || !Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Please enter a valid stock quantity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        stock: Number(formData.stock),
        lowStockAlert: formData.lowStockAlert ? Number(formData.lowStockAlert) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        tags: tags,
        status: formData.status || 'draft',
        seo: {
          title: formData.seoTitle || '',
          description: formData.seoDescription || ''
        }
      };

      // Handle image uploads if there are any
      const formDataToSend = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === 'images') {
          // Only append new files (not URLs)
          formData.images
            .filter(img => img instanceof File)
            .forEach(file => {
              formDataToSend.append('images', file);
            });
        } else if (key === 'seo') {
          // Handle SEO as nested object
          formDataToSend.append('seoTitle', value.title);
          formDataToSend.append('seoDescription', value.description);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (id) {
        // Update existing product
        await api.put(`/admin/products/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new product
        await api.post('/admin/products', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Show success message and redirect
      alert(`Product ${id ? 'updated' : 'created'} successfully!`);
      navigate('/admin/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
        <button
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Products
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Product Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <div className="group relative ml-1">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute left-1/2 z-10 -ml-24 w-48 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      A clear and descriptive product name helps customers find your product
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md ${errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm sm:text-sm`}
                  aria-describedby="name-help"
                />
                {errors.name ? (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                ) : (
                  <p id="name-help" className="mt-1 text-xs text-gray-500">
                    A clear and descriptive name for your product
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <div className="group relative ml-1">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute left-1/2 z-10 -ml-32 w-64 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Categories help customers find your products in the store
                    </div>
                  </div>
                </div>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setShowNewCategoryInput(true);
                      setFormData(prev => ({ ...prev, category: '' }));
                    } else {
                      setShowNewCategoryInput(false);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }
                  }}
                  className={`mt-1 block w-full rounded-md ${errors.category ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm sm:text-sm`}
                  aria-describedby="category-help"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Category</option>
                </select>
                {errors.category ? (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                ) : (
                  <p id="category-help" className="mt-1 text-xs text-gray-500">
                    Select a category or create a new one
                  </p>
                )}
                
                {showNewCategoryInput && (
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <div className="relative flex-grow focus-within:z-10">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter new category name"
                        className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={!newCategoryName.trim() || loading}
                      className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Don't see your category? Select "Create New Category" from the dropdown.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Auto-generated if empty"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto-generated if left empty
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (KES) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`${errors.price ? 'text-red-500' : 'text-gray-500'} sm:text-sm`}>
                      KES
                    </span>
                  </div>
                  <input
                    type="text"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleNumberChange}
                    className={`focus:ring-${errors.price ? 'red' : 'blue'}-500 focus:border-${errors.price ? 'red' : 'blue'}-500 block w-full pl-12 sm:text-sm ${errors.price ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Compare Price (KES)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="text"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleNumberChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Original price to show as a comparison
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cost Price (KES)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="text"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleNumberChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={handleNumberChange}
                  className={`mt-1 block w-full rounded-md ${errors.stock ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm sm:text-sm`}
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  name="lowStockAlert"
                  min="0"
                  value={formData.lowStockAlert}
                  onChange={handleNumberChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get notified when stock is low
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleNumberChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tags (press Enter)"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Press Enter to add tags. Tags help with search and organization.
                    </p>
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600 focus:outline-none"
                        >
                          <span className="sr-only">Remove tag</span>
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                            <path fillRule="evenodd" d="M8 1.3L6.7 0 4 2.7 1.3 0 0 1.3 2.7 4 0 6.7 1.3 8 4 5.3 6.7 8 8 6.7 5.3 4 8 1.3z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Images
                </label>
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {formData.images.map((image, index) => {
                      // Handle both cases: image object with preview/url or direct URL string
                      const imageUrl = image.preview || image.url || 
                        (image instanceof Blob ? URL.createObjectURL(image) : '');
                      
                      return (
                        <div key={index} className="relative group">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={`Product ${index + 1}`}
                              className="h-32 w-full object-cover rounded-md"
                              onLoad={() => {
                                // Revoke the object URL to avoid memory leaks
                                if (image.preview && image.file) {
                                  URL.revokeObjectURL(image.preview);
                                }
                              }}
                              onError={(e) => {
                                console.error('Error loading image:', image);
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center rounded-md transition-all duration-200">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-opacity duration-200"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  SEO Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SEO Title
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="seoTitle"
                        value={formData.seoTitle}
                        onChange={handleChange}
                        maxLength="60"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Optimized title for search engines"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoTitle.length}/60 characters. Most search engines use a maximum of 60 chars for the title.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SEO Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="seoDescription"
                        rows={3}
                        value={formData.seoDescription}
                        onChange={handleChange}
                        maxLength="160"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Optimized description for search engines"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoDescription.length}/160 characters. Most search engines use a maximum of 160 chars for the meta description.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
