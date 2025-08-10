import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import OverviewTab from '../../components/admin/OverviewTab';
import CategoriesTab from '../../components/admin/CategoriesTab';
import UsersTab from '../../components/admin/UsersTab';
import OrdersTab from '../../components/admin/OrdersTab';
import ProductsTab from '../../components/admin/ProductsTab';
import ProductFormPage from './ProductFormPage';
import EditUserPage from './EditUserPage';

const AdminDashboard = () => {
  // Hooks must be called at the top level
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // State declarations must be at the top level
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    recentUsers: [],
    products: [],
    categories: [],
    orders: []
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = new URLSearchParams(location.search);
  const tabList = ['overview', 'products', 'categories', 'orders', 'users'];
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Debug dashboard data - must be before any conditional returns
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard data:', {
        stats: dashboardData.stats,
        products: dashboardData.products?.length || 0,
        orders: dashboardData.orders?.length || 0,
        categories: dashboardData.categories?.length || 0,
        users: users?.length || 0,
        activeTab
      });
    }
  }, [dashboardData, users, activeTab]);

  // Fetch users separately for better debugging
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      const response = await api.get('/admin/users', {
        params: {
          page: 1,
          limit: 10,
          sort: '-createdAt'
        }
      });
      
      console.log('Users API response:', {
        status: response.status,
        data: response.data,
        users: response.data?.data?.users || response.data?.users || [],
        total: response.data?.total || 0
      });
      
      // Try different response structures
      const usersData = response.data?.data?.users || response.data?.users || [];
      console.log('Extracted users:', usersData);
      
      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error('Error fetching users:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setUsers([]);
      return [];
    }
  }, []);

  // Handle edit user
  const handleEditUser = useCallback((user) => {
    console.log('Edit user:', user);
    // Navigate to edit user page with user ID
    navigate(`/admin/dashboard/users/edit/${user._id}`);
  }, [navigate]);

  // Handle delete user
  const handleDeleteUser = useCallback(async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await api.delete(`/admin/users/${userId}`);
        if (response.status === 200) {
          // Refresh users list after successful deletion
          await fetchUsers();
          // Show success message using toast
          toast.success('User deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user. Please try again.');
      }
    }
  }, [fetchUsers]);

  // Authentication handling
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/admin/login', { state: { from: location }, replace: true });
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return;
    }
  }, [isAuthenticated, user, navigate, location, isLoading]);

  // Handle tab changes and URL synchronization
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    
    // Update URL without causing a full page reload
    const params = new URLSearchParams();
    if (tab !== 'overview') {
      params.set('tab', tab);
    }
    navigate(`?${params.toString()}`, { replace: true });
  }, [navigate]);

  // Set initial tab from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    
    if (tabFromUrl && tabList.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('overview');
    }
  }, [location.search, tabList]);

  // Fetch dashboard data
  useEffect(() => {
    console.log('useEffect for dashboard data - user:', user, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    if (!user || !isAuthenticated || isLoading) {
      console.log('Skipping dashboard data fetch - missing requirements');
      return;
    }
    
    const fetchDashboardData = async () => {
      // Only proceed if user is authenticated and has admin role
      if (user.role === 'admin' || user.role === 'super_admin') {
        console.log('Fetching dashboard data for admin user:', user.role);
        
        try {
          setLoading(true);
          console.log('Starting API requests...');
          
          // Fetch users separately
          console.log('Fetching users...');
          await fetchUsers();
          
          // Fetch other data in parallel
          console.log('Fetching dashboard data in parallel...');
          const [statsRes, ordersRes, productsRes, categoriesRes] = await Promise.all([
            api.get('/admin/dashboard').then(res => {
              console.log('Dashboard stats response:', res.data);
              return res;
            }).catch(err => {
              console.error('Error fetching dashboard stats:', err);
              return { data: { overview: {}, recentActivity: {} } };
            }),
            api.get('/admin/orders?limit=10').then(res => {
              console.log('Orders response:', res.data);
              return res;
            }).catch(err => {
              console.error('Error fetching orders:', err);
              return { data: { orders: [] } };
            }),
            api.get('/admin/products?limit=10').then(res => {
              console.log('Products response:', res.data);
              return res;
            }).catch(err => {
              console.error('Error fetching products:', err);
              return { data: { products: [] } };
            }),
            api.get('/admin/categories').then(res => {
              console.log('Categories response:', res.data);
              return res;
            }).catch(err => {
              console.error('Error fetching categories:', err);
              return { data: { categories: [] } };
            })
          ]);
          
          // Log raw API responses for debugging
          console.log('Raw API responses:', {
            statsRes: statsRes,
            ordersRes: ordersRes,
            productsRes: productsRes,
            categoriesRes: categoriesRes
          });
          
          // Helper function to extract data from different response formats
          const getResponseData = (response, type = '') => {
            // For users, handle the specific nested structure
            if (type === 'users') {
              return response?.data?.data?.users || [];
            }
            
            // For other types, use the existing logic
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
            orders: getResponseData(ordersRes) || []
          };
          
          console.log('Dashboard data after mapping:', dashboardDataUpdate);
          console.log('Updating dashboard data with:', dashboardDataUpdate);
          
          setDashboardData(dashboardDataUpdate);
          
          if (productsRes.data?.pagination) {
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
      } else if (user) {
        // User is logged in but not an admin
        console.warn('Unauthorized access to admin dashboard');
        navigate('/');
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



  // Render loading state
  if (isLoading) {
    console.log('Rendering loading state...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Handle unauthenticated users
  if (!isAuthenticated) {
    console.log('Rendering unauthenticated state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Handle unauthorized users (non-admin)
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    console.log('Rendering unauthorized state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Debug dashboard data - moved to top level (now at the top of the component)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          {location.pathname !== '/admin/dashboard' && (
            <button
              onClick={() => navigate('/admin/dashboard')}
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
            {/* Product routes */}
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />
            
            {/* User routes */}
            <Route path="users/edit/:id" element={
              <div className="w-full">
                <EditUserPage />
              </div>
            } />
            
            {/* Main dashboard content */}
            <Route 
              index 
              element={
                <div className="w-full" key="dashboard-content">

                  
                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {tabList.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange(tab)}
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
                        categories={dashboardData.categories || []} 
                        loading={loading}
                      />
                    )}
                    {activeTab === 'orders' && (
                      <OrdersTab 
                        orders={dashboardData.orders || []}
                        loading={loading}
                      />
                    )}
                    {activeTab === 'users' && (
                      <UsersTab 
                        users={users || []}
                        loading={loading}
                        error={error}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        currentUser={user}
                      />
                    )}
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
