import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import DataTable from './DataTable';

// Helper function to safely get category name
const getCategoryName = (category) => {
  if (!category) return 'Uncategorized';
  if (typeof category === 'object') {
    return category.name || 'Uncategorized';
  }
  return String(category || 'Uncategorized');
};

const ProductsTab = ({ dashboardData = {}, loading = false, navigate, pagination = { current: 1, pageSize: 10, total: 0 }, setPagination, handleDeleteProduct }) => {
  // Safely extract products with fallback to empty array
  const products = Array.isArray(dashboardData?.products) 
    ? dashboardData.products
    : [];
  
  // Log for debugging
  console.log('ProductsTab - Products:', products);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new product.</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/admin/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Product
          </button>
        </div>
      </div>
    );
  }
  // Helper function to get the full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${imagePath}`;
  };

  const productColumns = [
    {
      key: 'name',
      title: 'Product',
      dataType: 'custom',
      render: (_, product) => {
        // Safely handle potentially undefined product
        if (!product) return <div className="h-10 w-10 rounded-md bg-gray-200"></div>;
        
        // Get the first available image
        const mainImage = product.images?.[0];
        const imageUrl = mainImage?.url || '';
        const fullImageUrl = getImageUrl(imageUrl);
        
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              {mainImage ? (
                <div className="relative h-10 w-10">
                  <img 
                    className="h-10 w-10 rounded-md object-cover" 
                    src={fullImageUrl} 
                    alt={product.name || 'Product image'}
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop if the image fails to load
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `
                        <div class="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {product.name}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category',
      title: 'Category',
      dataType: 'custom',
      render: (category) => getCategoryName(category)
    },
    {
      key: 'price',
      title: 'Price',
      dataType: 'currency'
    },
    {
      key: 'stock',
      title: 'Stock',
      dataType: 'custom',
      render: (stock) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataType: 'status'
    },
    {
      key: 'actions',
      title: 'Actions',
      dataType: 'custom',
      render: (_, product) => (
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/products/edit/${product._id}`);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(product._id);
            }}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Products</h2>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Product
          </button>
        </div>
      </div>
      <div className="p-4">
        <DataTable
          columns={productColumns}
          data={dashboardData.products || []}
          loading={loading}
          emptyText="No products found"
          onRowClick={(product) => navigate(`/admin/products/${product._id}`)}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({ ...prev, pageSize: size }));
            },
          }}
        />
      </div>
    </div>
  );
};

export default ProductsTab;
