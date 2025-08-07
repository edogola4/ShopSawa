import React, { useState, useEffect } from 'react';
import CategoryModal from './CategoryModal';
import api from '../../services/api';

/**
 * CategoriesTab – lists all categories and provides a button to open a “New Category” modal.
 * For now we only render a simple table. Further CRUD functionality can be filled in later.
 */
const CategoriesTab = ({ dashboardData = {}, loading, navigate }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch categories on component mount and when categories change
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching categories...');
      
      // Add timestamp to prevent caching without custom headers
      const timestamp = new Date().getTime();
      const endpoint = `/admin/categories?t=${timestamp}`;
      console.log(`🔍 Fetching from admin endpoint: ${endpoint}`);
      
      // Make a simple GET request to the admin endpoint
      const res = await api.get(endpoint);
      console.log('📦 API Response:', res);
      
      // Handle different response structures
      let categoriesData = [];
      
      if (res.data) {
        // Try different response formats
        if (Array.isArray(res.data)) {
          categoriesData = res.data; // Direct array response
        } else if (res.data.categories) {
          categoriesData = res.data.categories; // { categories: [...] }
        } else if (res.data.data) {
          // Handle paginated response or similar
          categoriesData = Array.isArray(res.data.data) 
            ? res.data.data 
            : [];
        }
      }
      
      console.log(`✅ Found ${categoriesData.length} categories`);
      setCategories(categoriesData);
      
    } catch (err) {
      console.error('❌ Failed to fetch categories:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to load categories. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreated = (newCat) => {
    console.log('🆕 New category created:', newCat);
    // Refresh the entire categories list to ensure we have the latest data
    fetchCategories();
  };

  if (isLoading) {
    return <p className="text-gray-500 p-4">Loading categories...</p>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchCategories}
          className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          onClick={() => setModalOpen(true)}
        >
          + New Category
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Products</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td className="px-4 py-2 whitespace-nowrap">{cat.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{cat.slug}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{cat.productCount ?? 0}</td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr key="no-categories">
                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default CategoriesTab;
