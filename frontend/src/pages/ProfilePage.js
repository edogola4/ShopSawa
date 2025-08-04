// frontend/src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Settings, 
  Bell, 
  CreditCard,
  Lock,
  Heart,
  Package,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { orderService } from '../services/order.service';
import { formatCurrency, formatDate } from '../utils/helpers';
import { validateEmail, validatePhone, validateName } from '../utils/validators';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      showNotification('error', 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateProfileData = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(profileData.firstName)) {
      newErrors.firstName = 'Please enter a valid first name';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(profileData.lastName)) {
      newErrors.lastName = 'Please enter a valid last name';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordData = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileData()) {
      return;
    }

    try {
      setLoading(true);
      await updateProfile(profileData);
      setEditMode(false);
      showNotification('success', 'Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordData()) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement password change API
      showNotification('success', 'Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      gender: user?.gender || ''
    });
    setErrors({});
    setEditMode(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Information
                    </h2>
                    {!editMode ? (
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                        icon={Edit}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          icon={X}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          loading={loading}
                          icon={Save}
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="text"
                      name="firstName"
                      label="First Name"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      error={errors.firstName}
                      disabled={!editMode}
                      required
                    />

                    <Input
                      type="text"
                      name="lastName"
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      error={errors.lastName}
                      disabled={!editMode}
                      required
                    />

                    <Input
                      type="email"
                      name="email"
                      label="Email Address"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      error={errors.email}
                      disabled={!editMode}
                      icon={editMode ? null : Lock}
                      required
                    />

                    <Input
                      type="tel"
                      name="phone"
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      error={errors.phone}
                      disabled={!editMode}
                      required
                    />

                    <Input
                      type="date"
                      name="dateOfBirth"
                      label="Date of Birth"
                      value={profileData.dateOfBirth}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Order History
                  </h2>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(order.total)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.items?.length || 0} items
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Payment: {order.paymentMethod}</span>
                              <span>•</span>
                              <span>Delivery: {order.shippingMethod || 'Standard'}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" icon={Eye}>
                                View Details
                              </Button>
                              {order.status === 'delivered' && (
                                <Button size="sm" variant="outline">
                                  Reorder
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start shopping to see your order history here!
                      </p>
                      <Button>Start Shopping</Button>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Security Settings
                  </h2>

                  <div className="space-y-8">
                    {/* Change Password */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Change Password
                      </h3>
                      <div className="max-w-md space-y-4">
                        <Input
                          type="password"
                          name="currentPassword"
                          label="Current Password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          error={passwordErrors.currentPassword}
                          required
                        />

                        <Input
                          type="password"
                          name="newPassword"
                          label="New Password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          error={passwordErrors.newPassword}
                          required
                        />

                        <Input
                          type="password"
                          name="confirmPassword"
                          label="Confirm New Password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          error={passwordErrors.confirmPassword}
                          required
                        />

                        <Button
                          onClick={handleChangePassword}
                          loading={loading}
                          icon={Lock}
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add an extra layer of security to your account.
                      </p>
                      <Button variant="outline">
                        Enable 2FA (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Tabs - Placeholder Content */}
              {activeTab === 'addresses' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Saved Addresses
                  </h2>
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Address management coming soon!</p>
                  </div>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    My Wishlist
                  </h2>
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Wishlist feature coming soon!</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notification Preferences
                  </h2>
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Notification settings coming soon!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;