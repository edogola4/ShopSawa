import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

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
          <h3 className="font-medium">Something went wrong</h3>
          <p className="text-sm">Please refresh the page and try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProductFormPageContent() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditMode = Boolean(productId);
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files);
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleImageUpload(files);  
  };
  
  // Process uploaded images
  const handleImageUpload = (files) => {
    const validFiles = files.filter(file => 
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && 
      file.size <= 5 * 1024 * 1024 // 5MB limit
    );
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Only JPG, PNG, and WebP files under 5MB are allowed.');
    }
    
    // Create preview URLs for valid files
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      status: 'pending'
    }));
    
    setImages(prev => [...prev, ...newImages]);
    
    // Start upload simulation (replace with actual upload logic)
    newImages.forEach((img, index) => {
      const newIndex = images.length + index;
      simulateUpload(newIndex);
    });
  };
  
  // Simulate upload progress (replace with actual upload logic)
  const simulateUpload = (index) => {
    setUploadProgress(prev => ({ ...prev, [index]: 0 }));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        newProgress[index] = Math.min(100, (newProgress[index] || 0) + 10);
        
        if (newProgress[index] === 100) {
          clearInterval(interval);
          setImages(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'completed' };
            return updated;
          });
        }
        
        return newProgress;
      });
    }, 200);
  };
  
  // Remove an image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Clean up object URLs to prevent memory leaks
    URL.revokeObjectURL(images[index]?.preview);
  };
  
  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [images]);
  
  // Quill editor modules and formats
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image', 'color', 'background',
    'blockquote', 'code-block', 'align'
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    categoryName: '',
    stock: 0,
    images: [],
    inventory: {
      quantity: 0,
      lowStockThreshold: 10,
      trackQuantity: true
    }
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from:', API_ENDPOINTS.CATEGORIES.BASE);
        const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
        console.log('Categories response:', response);
        // Handle different possible response structures
        const categoriesData = response.data?.data || response.data || [];
        console.log('Categories data:', categoriesData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
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
    
    // If selecting an existing category, hide the new category input
    if (name === 'category' && value !== 'new') {
      setShowNewCategoryInput(false);
      setFormData(prev => ({
        ...prev,
        categoryName: ''
      }));
    }
  };
  
  // Special handler for the Quill editor
  const handleDescriptionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      description: value
    }));
  };
  
  const handleNewCategoryChange = (e) => {
    const { value } = e.target;
    setNewCategoryName(value);
    setFormData(prev => ({
      ...prev,
      category: 'new',
      categoryName: value
    }));
  };
  
  const handleAddNewCategory = () => {
    setShowNewCategoryInput(true);
    setFormData(prev => ({
      ...prev,
      category: 'new',
      categoryName: newCategoryName
    }));
  };
  
  const createNewCategory = async () => {
    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      toast.error('Please enter a category name');
      return;
    }
    
    setIsCreatingCategory(true);
    try {
      console.log('Creating category with name:', categoryName);
      
      const response = await api.post(API_ENDPOINTS.CATEGORIES.BASE, {
        name: categoryName
      });
      
      console.log('Full category creation response:', JSON.stringify(response, null, 2));
      
      // Handle different possible response structures
      let categoriesData = response.data?.data || response.data;
      
      // If we got an array, find the newly created category by name
      let newCategory;
      if (Array.isArray(categoriesData)) {
        console.log('Received array of categories, finding the new one by name');
        newCategory = categoriesData.find(cat => cat.name === categoryName);
        if (!newCategory && categoriesData.length > 0) {
          // If we can't find by name, take the last one in the array
          newCategory = categoriesData[categoriesData.length - 1];
        }
      } else {
        newCategory = categoriesData;
      }
      
      console.log('Extracted category data:', newCategory);
      
      if (!newCategory) {
        console.error('No category data in response');
        throw new Error('No category data received from server');
      }
      
      // Ensure the category has an ID
      if (!newCategory._id) {
        console.log('No _id in category, creating a temporary one');
        newCategory._id = `temp_${Date.now()}`;
      }
      
      // Ensure the category has a name
      if (!newCategory.name) {
        newCategory.name = categoryName;
      }
      
      console.log('New category created:', newCategory);
      
      // Update categories list and ensure it's an array
      setCategories(prev => {
        const updatedCategories = Array.isArray(prev) ? [...prev] : [];
        // Check if category already exists to avoid duplicates
        if (!updatedCategories.some(cat => cat._id === newCategory._id)) {
          updatedCategories.push(newCategory);
        }
        return updatedCategories;
      });
      
      // Set the new category as selected
      setFormData(prev => ({
        ...prev,
        category: newCategory._id,
        categoryName: ''
      }));
      
      setShowNewCategoryInput(false);
      setNewCategoryName('');
      toast.success(`Category "${newCategory.name}" created successfully`);
    } catch (error) {
      console.error('Error creating category:', error);
      const errorMessage = error.response?.data?.error?.message || 
                         error.message || 
                         'Failed to create category';
      toast.error(errorMessage);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Upload images to the server
  const uploadImages = async (files) => {
    const formData = new FormData();
    
    // Add each file to the form data
    files.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      // Note: We're not setting the Content-Type header here to let the browser
      // automatically set it with the correct boundary
      const response = await api.post(API_ENDPOINTS.PRODUCTS.UPLOAD_MULTIPLE, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Update progress state if needed
        }
      });
      
      return response.data; // Should return array of uploaded image URLs
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.description || formData.description.trim() === '' || formData.description === '<p><br></p>') {
      toast.error('Please enter a product description');
      return;
    }
    
    // Check if we need to create a new category first
    if (formData.category === 'new' && newCategoryName.trim()) {
      try {
        const newCategory = await createNewCategory();
        if (!newCategory) return; // Stop if category creation failed
        
        // Update form data with the new category
        setFormData(prev => ({
          ...prev,
          category: newCategory._id
        }));
      } catch (error) {
        console.error('Error creating category:', error);
        toast.error('Failed to create category');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // 1. Upload images first if there are any
      let imageUrls = [];
      const filesToUpload = images.filter(img => img.file).map(img => img.file);
      
      if (filesToUpload.length > 0) {
        const uploadResponse = await uploadImages(filesToUpload);
        imageUrls = uploadResponse.urls || [];
      }
      
      // 2. Prepare product payload
      const payload = { 
        ...formData,
        // If we have new images, add them to the payload
        ...(imageUrls.length > 0 && { images: imageUrls })
      };
      
      // Remove temporary fields before submission
      delete payload.categoryName;
      
      // 3. Save the product
      let savedProduct;
      if (isEditMode) {
        savedProduct = await api.put(`${API_ENDPOINTS.PRODUCTS.BASE}/${productId}`, payload);
        toast.success('Product updated successfully');
      } else {
        savedProduct = await api.post(API_ENDPOINTS.PRODUCTS.BASE, payload);
        toast.success('Product created successfully');
      }
      
      // 4. If we have images and this is a new product, update the product with the image URLs
      if (imageUrls.length > 0 && savedProduct?.data?._id) {
        await api.put(`${API_ENDPOINTS.PRODUCTS.BASE}/${savedProduct.data._id}`, {
          images: imageUrls
        });
      }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <div className="space-y-2">
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="new">+ Create new category</option>
                </select>
                
                {formData.category === 'new' && showNewCategoryInput && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={handleNewCategoryChange}
                      placeholder="Enter new category name"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={createNewCategory}
                      disabled={!newCategoryName.trim() || isCreatingCategory}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingCategory ? 'Creating...' : 'Add'}
                    </button>
                  </div>
                )}
                
                {formData.category === 'new' && !showNewCategoryInput && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add new category
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                name="price"
                id="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inventory.quantity" className="block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="inventory.quantity"
                  id="inventory.quantity"
                  required
                  min="0"
                  step="1"
                  value={formData.inventory?.quantity || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    setFormData(prev => ({
                      ...prev,
                      inventory: {
                        ...prev.inventory,
                        quantity: value
                      }
                    }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Current stock available for sale</p>
              </div>

              <div>
                <label htmlFor="inventory.lowStockThreshold" className="block text-sm font-medium text-gray-700">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  name="inventory.lowStockThreshold"
                  id="inventory.lowStockThreshold"
                  min="0"
                  step="1"
                  value={formData.inventory?.lowStockThreshold || 10}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    setFormData(prev => ({
                      ...prev,
                      inventory: {
                        ...prev.inventory,
                        lowStockThreshold: value
                      }
                    }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Get notified when stock is low</p>
              </div>
            </div>
            
            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <div className="mt-1">
                <ReactQuill
                  theme="snow"
                  value={formData.description || ''}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  className={`bg-white rounded-md border ${
                    !formData.description || formData.description.trim() === '' || formData.description === '<p><br></p>' 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                  placeholder="Enter product description..."
                />
              </div>
              <p className={`mt-1 text-sm ${
                !formData.description || formData.description.trim() === '' || formData.description === '<p><br></p>' 
                  ? 'text-red-600' 
                  : 'text-gray-500'
              }`}>
                {!formData.description || formData.description.trim() === '' || formData.description === '<p><br></p>' 
                  ? 'Description is required' 
                  : 'Provide a detailed description of the product'}
              </p>
            </div>
            
            {/* Image Upload Section */}
            <div className="col-span-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Product Images</h3>
              
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                      <span>Upload files</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        multiple
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleFileInputChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              </div>
              
              {/* Image Previews */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="h-full w-full object-cover object-center"
                        />
                        {uploadProgress[index] < 100 && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress[index]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span className="truncate">{image.name}</span>
                        <span>{(image.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
        </form>
      </div>
    </div>
  );
}

const ProductFormPage = () => {
  return (
    <ErrorBoundary>
      <ProductFormPageContent />
    </ErrorBoundary>
  );
};

export default ProductFormPage;
