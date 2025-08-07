import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AdminRoute from './components/common/AdminRoute';
import LoginPage from './pages/LoginPage';
import { AdminDashboard } from './pages/admin';

// Minimal app containing only admin-facing routes
const AdminApp = () => (
  <Router>
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin">
            <Route
              index
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>
          {/* default redirect */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  </Router>
);

export default AdminApp;
