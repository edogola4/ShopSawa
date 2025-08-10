import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InformationCircleIcon, EnvelopeIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const UsersTab = ({ 
  users = [], 
  loading = false, 
  error = null, 
  onEdit = () => {}, 
  onDelete = () => {},
  currentUser 
}) => {
  const navigate = useNavigate();
  
  // Debug log to see what props we're receiving
  React.useEffect(() => {
    console.log('UsersTab - Received props:', { 
      users, 
      usersLength: users?.length || 0,
      loading, 
      error,
      usersSample: users?.length > 0 ? users[0] : 'No users',
      usersRaw: users
    });
    
    if (users?.length > 0) {
      console.log('First user data structure:', JSON.stringify(users[0], null, 2));
    } else if (users && !Array.isArray(users)) {
      console.error('Users is not an array:', users);
    }
  }, [users, loading, error]);
  
  // Check if current user can edit/delete the target user
  const canEditUser = (targetUser) => {
    if (!currentUser) return false;
    // Super admins can edit anyone
    if (currentUser.role === 'super_admin') return true;
    // Admins can only edit other admins and customers, not other super admins
    if (currentUser.role === 'admin' && targetUser.role !== 'super_admin') return true;
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (!currentUser) return false;
    // Prevent deleting self
    if (currentUser._id === targetUser._id) return false;
    // Super admins can delete anyone except themselves
    if (currentUser.role === 'super_admin') return true;
    // Admins can only delete customers, not other admins or super admins
    if (currentUser.role === 'admin' && targetUser.role === 'customer') return true;
    return false;
  };

  // Handle edit button click
  const handleEdit = (user, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEditUser(user)) {
      onEdit(user);
    }
  };

  // Handle delete button click
  const handleDelete = (user, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (canDeleteUser(user)) {
      if (window.confirm(`Are you sure you want to delete ${getUserProperty(user, 'name') || 'this user'}?`)) {
        onDelete(user._id);
      }
    }
  };

  // Add a safe way to access user properties
  const getUserProperty = (user, prop) => {
    if (!user) return '';
    // Try different possible property names
    if (user[prop] !== undefined) return user[prop];
    if (prop === 'name' && (user.firstName || user.lastName)) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return '';
  };
  
  // Default pagination state (can be overridden by props if needed)
  const [pagination] = React.useState({
    current: 1,
    pageSize: 10,
    total: users.length,
  });

  const handleTableChange = () => {
    // Handle pagination changes if needed
    // Currently using server-side pagination from parent
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Admin'
      },
      super_admin: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Super Admin'
      },
      user: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'User'
      },
      default: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: role
      }
    };

    const { bg, text, label } = roleConfig[role] || roleConfig.default;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage all registered users and their permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/register')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserCircleIcon className="-ml-1 mr-2 h-5 w-5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <UserCircleIcon className="h-4 w-4 mr-2" />
                  Name
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Email
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Role
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserProperty(user, 'name') || getUserProperty(user, 'firstName') || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getUserProperty(user, 'username') || 'No username'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserProperty(user, 'email')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role || 'user')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button 
                      onClick={(e) => handleEdit(user, e)}
                      disabled={!canEditUser(user)}
                      className={`${canEditUser(user) ? 'text-blue-600 hover:text-blue-900' : 'text-gray-400 cursor-not-allowed'} mr-2`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => handleDelete(user, e)}
                      disabled={!canDeleteUser(user)}
                      className={`${canDeleteUser(user) ? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-not-allowed'}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > pagination.pageSize && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleTableChange({
                ...pagination,
                current: pagination.current - 1,
              })}
              disabled={pagination.current === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleTableChange({
                ...pagination,
                current: pagination.current + 1,
              })}
              disabled={pagination.current * pagination.pageSize >= pagination.total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">
                  {pagination.pageSize * (pagination.current - 1) + 1}
                </span> to <span className="font-medium">
                  {Math.min(pagination.pageSize * pagination.current, pagination.total)}
                </span> of <span className="font-medium">{pagination.total}</span> users
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handleTableChange({
                    ...pagination,
                    current: pagination.current - 1,
                  })}
                  disabled={pagination.current === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.current === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleTableChange({
                    ...pagination,
                    current: pagination.current + 1,
                  })}
                  disabled={pagination.current * pagination.pageSize >= pagination.total}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.current * pagination.pageSize >= pagination.total ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
