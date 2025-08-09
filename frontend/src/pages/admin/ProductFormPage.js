import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    categoryName: '',
    stock: 0,
    images: []
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we're in the middle of creating a new category, handle that first
    if (formData.category === 'new' && newCategoryName.trim()) {
      await createNewCategory();
      return; // Let the category creation handler handle the rest
    }
    
    setLoading(true);
    try {
      const payload = { ...formData };
      
      // Remove temporary fields before submission
      delete payload.categoryName;
      
      if (isEditMode) {
        await api.put(`${API_ENDPOINTS.PRODUCTS}/${productId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post(API_ENDPOINTS.PRODUCTS, payload);
        toast.success('Product created successfully');
      }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
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
