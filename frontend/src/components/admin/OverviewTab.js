import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import DataTable from './DataTable';
import StatsCard from './StatsCard';

const OverviewTab = ({ dashboardData, loading, navigate }) => {
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={dashboardData.stats.totalUsers || 0}
          icon={UserGroupIcon}
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          title="Total Orders"
          value={dashboardData.stats.totalOrders || 0}
          icon={ShoppingCartIcon}
          iconBgColor="bg-green-500"
        />
        <StatsCard
          title="Total Products"
          value={dashboardData.stats.totalProducts || 0}
          icon={CubeIcon}
          iconBgColor="bg-yellow-500"
        />
        <StatsCard
          title="Total Revenue"
          value={dashboardData.stats.totalRevenue || 0}
          icon={CurrencyDollarIcon}
          iconBgColor="bg-purple-500"
          isCurrency={true}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <Link 
              to="/admin/orders" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="p-4">
          <DataTable
            columns={orderColumns}
            data={dashboardData.recentOrders || []}
            loading={loading}
            emptyText="No recent orders found"
            onRowClick={(order) => navigate(`/admin/orders/${order._id}`)}
          />
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
            <Link 
              to="/admin/users" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="p-4">
          <DataTable
            columns={userColumns}
            data={dashboardData.recentUsers || []}
            loading={loading}
            emptyText="No recent users found"
            onRowClick={(user) => navigate(`/admin/users/${user._id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
