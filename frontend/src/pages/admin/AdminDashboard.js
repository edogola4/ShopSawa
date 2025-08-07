import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate as useHistory, Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OverviewTab from '../../components/admin/OverviewTab';
import CategoriesTab from '../../components/admin/CategoriesTab';
import UsersTab from '../../components/admin/UsersTab';
import OrdersTab from '../../components/admin/OrdersTab';
import { 
  CubeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ProductsTab from '../../components/admin/ProductsTab';
import ProductFormPage from './ProductFormPage'; // Import the new component

const AdminDashboard = () => {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    recentUsers: [],
    products: [],
    categories: [],
    orders: [],
    users: []
  });
  
  const [loading, setLoading] = useState(true);
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const tabList = ['overview', 'products', 'categories', 'orders', 'users'];

  // sync tab to query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      navigate({ pathname: '/admin', search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const [statsRes, ordersRes, usersRes, productsRes, categoriesRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/orders?limit=10'),
          api.get('/admin/users?limit=10'),
          api.get('/admin/products?limit=10'),
          api.get('/admin/categories')
        ]);
        
        // Map the backend response to the expected frontend format
        setDashboardData({
          stats: {
            totalUsers: statsRes.data.overview?.totalUsers || 0,
            totalOrders: statsRes.data.overview?.totalOrders || 0,
            totalProducts: statsRes.data.overview?.totalProducts || 0,
            totalRevenue: statsRes.data.overview?.totalRevenue || 0
          },
          recentOrders: statsRes.data.recentActivity?.orders || [],
          recentUsers: statsRes.data.recentActivity?.users || [],
          products: productsRes.data.products || [],
          categories: categoriesRes.data.categories || [],
          orders: ordersRes.data.orders || [],
          users: usersRes.data.users || []
        });
        
        if (productsRes.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: productsRes.data.pagination.total
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/admin/products/${productId}`);
        // Refresh products after deletion
        const response = await api.get('/admin/products?limit=10');
        setDashboardData(prev => ({
          ...prev,
          products: response.data.products || []
        }));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Table column definitions
  const orderColumns = [
    { 
      key: 'orderNumber', 
      title: 'Order #',
      dataType: 'text'
    },
    { 
      key: 'customer', 
      title: 'Customer',
      dataType: 'custom',
      render: (customer) => customer?.name || 'Guest'
    },
    { 
      key: 'total', 
      title: 'Amount',
      dataType: 'currency'
    },
    { 
      key: 'status', 
      title: 'Status',
      dataType: 'status'
    },
    { 
      key: 'createdAt', 
      title: 'Date',
      dataType: 'date'
    }
  ];

  const userColumns = [
    {
      key: 'name',
      title: 'Name',
      dataType: 'custom',
      render: (_, user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {user.avatar?.url ? (
              <img 
                className="h-10 w-10 rounded-full" 
                src={user.avatar.url} 
                alt={`${user.firstName} ${user.lastName}`} 
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {`${user.firstName} ${user.lastName || ''}`.trim() || 'No Name'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataType: 'text'
    },
    {
      key: 'role',
      title: 'Role',
      dataType: 'custom',
      render: (role) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {role?.toUpperCase()}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Joined',
      dataType: 'date'
    }
  ];

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
                <CubeIcon className="h-5 w-5 text-gray-400" />
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
      dataType: 'text'
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />
            <Route 
              path="*" 
              element={
                <>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                      {tabList.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="py-6">
                    {activeTab === 'overview' && (
                      <OverviewTab 
                        dashboardData={dashboardData} 
                        loading={loading} 
                        navigate={navigate} 
                      />
                    )}
                    {activeTab === 'products' && (
                      <ProductsTab 
                        dashboardData={dashboardData} 
                        loading={loading} 
                        navigate={navigate}
                        pagination={pagination}
                        setPagination={setPagination}
                        handleDeleteProduct={handleDeleteProduct}
                      />
                    )}
                    {activeTab === 'categories' && (
                      <CategoriesTab
                        dashboardData={dashboardData}
                        loading={loading}
                        navigate={navigate}
                      />
                    )}
                    {activeTab === 'orders' && (
                      <OrdersTab
                        dashboardData={dashboardData}
                        loading={loading}
                        navigate={navigate}
                      />
                    )}
                    {activeTab === 'users' && (
                      <UsersTab
                        dashboardData={dashboardData}
                        loading={loading}
                        navigate={navigate}
                      />
                    )}
                  </div>
                </>
              } 
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
