import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import DataTable from './DataTable';

const ProductsTab = ({ dashboardData, loading, navigate, pagination, setPagination, handleDeleteProduct }) => {
  const productColumns = [
    {
      key: 'name',
      title: 'Product',
      dataType: 'custom',
      render: (_, product) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {product.images?.[0] ? (
              <img 
                className="h-10 w-10 rounded-md object-cover" 
                src={product.images[0]} 
                alt={product.name} 
              />
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
      )
    },
    {
      key: 'category',
      title: 'Category',
      dataType: 'custom',
      render: (category) => category?.name || 'Uncategorized'
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
