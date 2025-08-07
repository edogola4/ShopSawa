import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OverviewTab from '../../components/admin/OverviewTab';
import CategoriesTab from '../../components/admin/CategoriesTab';
import UsersTab from '../../components/admin/UsersTab';
import OrdersTab from '../../components/admin/OrdersTab';
import ProductsTab from '../../components/admin/ProductsTab';
import ProductFormPage from './ProductFormPage';

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
      console.log('Fetching dashboard data...');
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        console.warn('Unauthorized access to admin dashboard');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        console.log('Starting API requests...');
        
        const [statsRes, ordersRes, usersRes, productsRes, categoriesRes] = await Promise.all([
          api.get('/admin/dashboard').catch(err => {
            console.error('Error fetching dashboard stats:', err);
            return { data: { overview: {}, recentActivity: {} } };
          }),
          api.get('/admin/orders?limit=10').catch(err => {
            console.error('Error fetching orders:', err);
            return { data: { orders: [] } };
          }),
          api.get('/admin/users?limit=10').catch(err => {
            console.error('Error fetching users:', err);
            return { data: { users: [] } };
          }),
          api.get('/admin/products?limit=10').catch(err => {
            console.error('Error fetching products:', err);
            return { data: { products: [] } };
          }),
          api.get('/admin/categories').catch(err => {
            console.error('Error fetching categories:', err);
            return { data: { categories: [] } };
          })
        ]);
        
        // Log raw API responses for debugging
        console.log('Raw API responses:', {
          statsRes: statsRes,
          ordersRes: ordersRes,
          usersRes: usersRes,
          productsRes: productsRes,
          categoriesRes: categoriesRes
        });
        
        // Helper function to extract data from different response formats
        const getResponseData = (response) => {
          // Handle different response formats
          if (response.data?.data !== undefined) {
            return response.data.data;
          }
          if (Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data?.products) {
            return response.data.products;
          }
          if (response.data?.categories) {
            return response.data.categories;
          }
          if (response.data?.orders) {
            return response.data.orders;
          }
          if (response.data?.users) {
            return response.data.users;
          }
          return [];
        };
        
        // Map the backend response to the expected frontend format
        const dashboardDataUpdate = {
          stats: {
            totalUsers: statsRes.data?.overview?.totalUsers || 0,
            totalOrders: statsRes.data?.overview?.totalOrders || 0,
            totalProducts: statsRes.data?.overview?.totalProducts || 0,
            totalRevenue: statsRes.data?.overview?.totalRevenue || 0
          },
          recentOrders: statsRes.data?.recentActivity?.orders || [],
          recentUsers: statsRes.data?.recentActivity?.users || [],
          products: getResponseData(productsRes) || [],
          categories: getResponseData(categoriesRes) || [],
          orders: getResponseData(ordersRes) || [],
          users: getResponseData(usersRes) || []
        };
        
        console.log('Updating dashboard data with:', dashboardDataUpdate);
        setDashboardData(dashboardDataUpdate);
        
        if (productsRes.data.pagination) {
          console.log('Updating pagination with:', productsRes.data.pagination);
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

  // Table column definitions have been moved to their respective tab components for better organization.

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          {location.pathname.includes('/products/') && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            {/* Product-specific routes */}
            <Route path="products/new" element={
              <div className="w-full">
                <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                <ProductFormPage />
              </div>
            } />
            
            <Route path="products/edit/:id" element={
              <div className="w-full">
                <h2 className="text-2xl font-bold mb-6">Edit Product</h2>
                <ProductFormPage />
              </div>
            } />
            
            {/* Main dashboard content */}
            <Route index element={
              <div className="relative">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabList.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${
                          activeTab === tab
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'overview' && <OverviewTab dashboardData={dashboardData} loading={loading} navigate={navigate} />}
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
                      categories={dashboardData.categories} 
                    />
                  )}
                  {activeTab === 'orders' && (
                    <OrdersTab 
                      orders={dashboardData.orders} 
                    />
                  )}
                  {activeTab === 'users' && (
                    <UsersTab 
                      users={dashboardData.users} 
                    />
                  )}
                </div>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
