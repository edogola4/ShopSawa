import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-toastify';
import { secureStorage } from '../../utils/helpers';
import { STORAGE_KEYS } from '../../utils/constants';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in ProductFormPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <h2 className="font-bold">Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProductFormPageContent = () => {
  console.log('ProductFormPage rendered');
  
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  console.log('ProductFormPage props:', { id, isEditMode, user });
  
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
    const imageToRemove = formData.images[index];
    
    // Clean up object URL to prevent memory leaks
    if (imageToRemove && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
      console.log('🗑️ Cleaned up preview URL for:', imageToRemove.name || 'image');
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    console.log(`🗑️ Removed image at index ${index}`);
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
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    
    if (files.length > 0) {
      console.log('📂 Dropped', files.length, 'image files');
      handleImageUpload({ target: { files } });
    } else {
      setError('Please drop valid image files (PNG, JPG, WebP) under 5MB.');
    }
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    console.log('📸 Processing', files.length, 'image files');
    
    // Filter and validate files
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        console.warn('Skipping non-image file:', file.name);
        return false;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.warn('Skipping large file:', file.name, 'Size:', file.size);
        toast.error && toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) {
      setError('No valid image files selected. Please choose PNG, JPG, or WebP files under 5MB.');
      return;
    }
    
    // Create image objects with previews
    const newImages = validFiles.map(file => {
      try {
        const preview = URL.createObjectURL(file);
        console.log('✅ Created preview for:', file.name);
        
        return {
          file: file,
          preview: preview,
          name: file.name,
          size: file.size,
          type: file.type
        };
      } catch (error) {
        console.error('Error creating preview for file:', file.name, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
    
    if (newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      
      console.log(`📸 Added ${newImages.length} images to form`);
      setError(''); // Clear any previous errors
    }
    
    // Clear the file input
    if (e.target) {
      e.target.value = '';
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
      console.log('1. Creating category with name:', categoryName);
      
      // Create a simple category data object with required fields
      const categoryData = {
        name: categoryName.trim(),
        slug: categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        isActive: true
      };
      
      console.log('2. Sending category data:', JSON.stringify(categoryData, null, 2));
      
      // Make the API request with the category data directly (not wrapped in a data object)
      console.log('3. Making API request to create category...');
      const response = await api.post('/admin/categories', categoryData, {
        includeAuth: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('4. API Response:', response);
      
      // The API service already parses the response, so we can use it directly
      const responseData = response;
      
      console.log('5. Raw response data:', JSON.stringify(responseData, null, 2));
      
      // Handle different response formats
      let newCategory;
      
      // Case 1: Response has a category object in data.category
      if (responseData.data?.category) {
        newCategory = responseData.data.category;
      } 
      // Case 2: Response has an array of categories in data (which might contain category objects)
      else if (Array.isArray(responseData.data)) {
        // Find the newly created category by name in the nested category objects
        const categoryItem = responseData.data.find(item => 
          item.category?.name?.trim().toLowerCase() === categoryName.trim().toLowerCase()
        );
        
        if (categoryItem?.category) {
          newCategory = categoryItem.category;
        } else if (responseData.data.length > 0 && responseData.data[0].category) {
          // If we can't find by name, take the first category object
          newCategory = responseData.data[0].category;
        } else if (responseData.data.length > 0) {
          // Fallback to the first item if it's not nested in a category object
          newCategory = responseData.data[0];
        }
      }
      // Case 3: Response has the category at the top level
      else if (responseData._id || responseData.id) {
        newCategory = responseData;
      }
      
      if (newCategory) {
        console.log('6. New category created successfully:', newCategory);
        
        // Update the categories list with the new category if it's not already there
        setCategories(prev => {
          const exists = prev.some(cat => 
            (cat._id || cat.id) === (newCategory._id || newCategory.id)
          );
          return exists ? prev : [...prev, newCategory];
        });
        
        // Update the form to select the new category
        setFormData(prev => ({
          ...prev,
          category: newCategory._id || newCategory.id
        }));
        
        // Reset the new category input
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        setError(''); // Clear any previous errors
        
        // Show success message
        toast.success('Category created successfully');
        return; // Exit the function after successful creation
      }
      
      // If we get here, we couldn't find the new category in the response
      console.error('7. Could not determine the new category from response:', responseData);
      throw new Error('Category created but could not be processed');
      
      // This code block is no longer needed as we're handling the response above
      // The logic has been moved into the response handling blocks
    } catch (err) {
      console.error('Error creating category:', err);
      
      // Log detailed error information
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        response: err.response?.data
      });
      
      // Set a user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create new category. Please try again.';
      setError(errorMessage);
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
      // Debug: Check token
      const apiToken = api.getAuthToken();
      if (!apiToken) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Form data before submission:', formData);
      
      // Create base product data
      const productData = {
        name: formData.name,
        description: formData.description || 'No description provided',
        price: Number(formData.price) || 0,
        category: formData.category,
        sku: formData.sku || '',
        comparePrice: formData.comparePrice ? Number(formData.comparePrice) : 0,
        costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        stock: formData.stock ? Number(formData.stock) : 0,
        lowStockAlert: formData.lowStockAlert ? Number(formData.lowStockAlert) : 5,
        weight: formData.weight ? Number(formData.weight) : 0,
        status: formData.status || 'active',
        tags: tags.length > 0 ? tags : [],
        seo: {
          title: formData.seoTitle || '',
          description: formData.seoDescription || ''
        }
      };
      
      // Log the data being sent
      console.log('Product data being sent:', JSON.stringify(productData, null, 2));

      const url = isEditMode ? `/admin/products/${id}` : '/admin/products';
      const token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN) || apiToken;
      
      // Check if we have images to upload
      const hasImages = formData.images && formData.images.length > 0;
      const hasNewImages = hasImages && formData.images.some(img => 
        img.file instanceof File || img instanceof File
      );
      
      if (hasNewImages) {
        console.log('📤 Sending FormData with images');
        
        // Create FormData for images
        const formDataObj = new FormData();
        
        // Add all product data to FormData
        Object.keys(productData).forEach(key => {
          if (productData[key] !== null && productData[key] !== undefined) {
            if (typeof productData[key] === 'object' && !Array.isArray(productData[key])) {
              // Handle nested objects (like SEO)
              formDataObj.append(key, JSON.stringify(productData[key]));
            } else if (Array.isArray(productData[key])) {
              // Handle arrays (like tags) - send as JSON string
              formDataObj.append(key, JSON.stringify(productData[key]));
            } else {
              formDataObj.append(key, String(productData[key]));
            }
          }
        });
        
        // Add image files to FormData
        formData.images.forEach((image, index) => {
          const file = image.file || image;
          if (file instanceof File) {
            formDataObj.append('images', file, file.name);
            console.log(`Added image ${index + 1}:`, file.name, file.size, 'bytes');
          }
        });
        
        // Log FormData contents for debugging
        console.log('📤 FormData contents:');
        for (let [key, value] of formDataObj.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
          } else {
            console.log(`${key}:`, value);
          }
        }
        
        // Make request with FormData
        const response = isEditMode 
          ? await api.put(url, formDataObj, {
              headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type - let browser set it with boundary
              }
            })
          : await api.post(url, formDataObj, {
              headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type - let browser set it with boundary
              }
            });
        
        console.log('✅ API Response with images:', response);
        
        // Success handling
        if (response && (response.success || response.status === 'success' || response.data)) {
          console.log('🎉 Product with images created successfully!');
          
          if (toast && typeof toast.success === 'function') {
            toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
          } else {
            alert(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
          }
          
          setTimeout(() => {
            navigate('/admin/products');
          }, 1500);
          
          return response;
        }
        
      } else {
        console.log('📤 Sending JSON data (no new images)');
        
        // No new images - send JSON
        const response = isEditMode 
          ? await api.put(url, productData, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              }
            })
          : await api.post(url, productData, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              }
            });
        
        console.log('✅ API Response:', response);
        
        // Success handling
        if (response && (response.success || response.status === 'success' || response.data)) {
          console.log('🎉 Product operation successful!');
          
          if (toast && typeof toast.success === 'function') {
            toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
          } else {
            alert(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
          }
          
          setTimeout(() => {
            navigate('/admin/products');
          }, 1500);
          
          return response;
        } else {
          console.warn('⚠️ Unexpected response format:', response);
          setError('Product may have been saved, but received unexpected response.');
        }
      } 
    } catch (err) {
      console.error('Error saving product:', err);
      
      // Log detailed error information
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error headers:', err.response.headers);
        
        // Check for validation errors
        if (err.response.data.error?.details) {
          console.error('Validation errors:', err.response.data.error.details);
          setError('Validation error: ' + JSON.stringify(err.response.data.error.details));
        } else if (err.response.data.error?.message) {
          setError(err.response.data.error.message);
        } else if (err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to save product. Please check the console for details.');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please try again.');
      } else {
        console.error('Error message:', err.message);
        setError('An error occurred: ' + err.message);
      }
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

const ProductFormPage = () => {
  console.log('Rendering ProductFormPage, path:', window.location.pathname);
  
  React.useEffect(() => {
    console.log('ProductFormPage mounted');
    return () => console.log('ProductFormPage unmounted');
  }, []);

  try {
    return (
      <ErrorBoundary>
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {window.location.pathname.includes('edit') ? 'Edit Product' : 'Add New Product'}
          </h1>
          <ProductFormPageContent />
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in ProductFormPage render:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Error Loading Product Form</h1>
        <p className="text-red-500">An error occurred while loading the product form. Please try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    );
  }
};

export default ProductFormPage;
