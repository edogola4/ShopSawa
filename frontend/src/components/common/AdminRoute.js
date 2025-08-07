import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  // Check if user is authenticated and has admin role
  if (!user) {
    // Redirect to admin login page with the return URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    // User is logged in but not an admin, show access denied
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
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

  return children;
};

export default AdminRoute;
