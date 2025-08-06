// frontend/src/pages/ProfilePage.js - COMPLETE USER PROFILE & ACCOUNT MANAGEMENT

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Bell, 
  CreditCard, 
  Heart, 
  Package, 
  Settings, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  Download,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  Globe,
  Moon,
  Sun,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { userService } from '../services/user.service';
import { formatCurrency, formatDate } from '../utils/helpers';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' or 'primary'
}) => {
  if (!isOpen) return null;

  const buttonClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${buttonClasses[variant]} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { addNotification, theme, toggleTheme } = useApp();

  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    bio: user?.bio || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    sms: false
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showPurchaseHistory: false,
    allowReviews: true
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [accountStats, setAccountStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    favoriteCategory: '',
    memberSince: user?.createdAt || new Date(),
    loyaltyPoints: 0
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    addressId: null
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  // Load user data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile data
      const [addressesRes, paymentRes, statsRes] = await Promise.all([
        userService.getUserAddresses(),
        userService.getPaymentMethods(),
        userService.getAccountStats()
      ]);

      if (addressesRes.success) setAddresses(addressesRes.data || []);
      if (paymentRes.success) setPaymentMethods(paymentRes.data || []);
      if (statsRes.success) setAccountStats(statsRes.data || accountStats);

    } catch (error) {
      console.error('Failed to load user data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profile data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setEditMode(false);
        addNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully'
        });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match'
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setPasswordChangeMode(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        addNotification({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been changed successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Password Change Failed',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await userService.uploadAvatar(formData);
      
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Avatar Updated',
          message: 'Your profile picture has been updated'
        });
        // Refresh user data
        loadUserData();
      } else {
        throw new Error(response.message || 'Failed to upload avatar');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    navigate('/profile/addresses/add');
  };

  const handleEditAddress = (addressId) => {
    navigate(`/profile/addresses/${addressId}/edit`);
  };

  const handleDeleteAddress = async (addressId) => {
    setDeleteDialog({
      isOpen: true,
      addressId
    });
  };

  const confirmDeleteAddress = async () => {
    if (!deleteDialog.addressId) return;
    
    try {
      const response = await userService.deleteAddress(deleteDialog.addressId);
      
      if (response.success) {
        setAddresses(addresses.filter(addr => addr._id !== deleteDialog.addressId));
        addNotification({
          type: 'success',
          title: 'Address Deleted',
          message: 'Address has been removed from your account'
        });
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete address. Please try again.'
      });
    } finally {
      setDeleteDialog({ isOpen: false, addressId: null });
    }
  };

  const handleNotificationUpdate = async (newNotifications) => {
    try {
      const response = await userService.updateNotificationSettings(newNotifications);
      
      if (response.success) {
        setNotifications(newNotifications);
        addNotification({
          type: 'success',
          title: 'Settings Updated',
          message: 'Your notification preferences have been saved'
        });
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message
      });
    }
  };

  const handlePrivacyUpdate = async (newPrivacy) => {
    try {
      const response = await userService.updatePrivacySettings(newPrivacy);
      
      if (response.success) {
        setPrivacy(newPrivacy);
        addNotification({
          type: 'success',
          title: 'Privacy Updated',
          message: 'Your privacy settings have been saved'
        });
      } else {
        throw new Error(response.message || 'Failed to update privacy');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            profileData={profileData}
            setProfileData={setProfileData}
            editMode={editMode}
            setEditMode={setEditMode}
            onSave={handleProfileUpdate}
            onAvatarUpload={handleAvatarUpload}
            loading={loading}
            user={user}
            accountStats={accountStats}
          />
        );
      
      case 'addresses':
        return (
          <AddressesTab
            addresses={addresses}
            onAdd={handleAddAddress}
            onEdit={handleEditAddress}
            onDelete={handleDeleteAddress}
          />
        );
      
      case 'payment':
        return (
          <PaymentMethodsTab
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
          />
        );
      
      case 'orders':
        return <OrdersTab />;
      
      case 'wishlist':
        return <WishlistTab />;
      
      case 'notifications':
        return (
          <NotificationsTab
            notifications={notifications}
            onUpdate={handleNotificationUpdate}
          />
        );
      
      case 'security':
        return (
          <SecurityTab
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            passwordChangeMode={passwordChangeMode}
            setPasswordChangeMode={setPasswordChangeMode}
            onPasswordChange={handlePasswordChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
          />
        );
      
      case 'preferences':
        return (
          <PreferencesTab
            privacy={privacy}
            onPrivacyUpdate={handlePrivacyUpdate}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        );
      
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access your profile
          </p>
          <Button onClick={() => navigate('/login')} variant="primary">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {/* User Avatar & Info */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={user?.avatar?.url || '/images/default-avatar.png'}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <button
                    onClick={() => document.getElementById('avatar-upload').click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-3">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                
                {/* Loyalty Status */}
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Premium Member
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {accountStats.loyaltyPoints} loyalty points
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, addressId: null })}
        onConfirm={confirmDeleteAddress}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete Address"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ 
  profileData, 
  setProfileData, 
  editMode, 
  setEditMode, 
  onSave, 
  onAvatarUpload, 
  loading, 
  user, 
  accountStats 
}) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Personal Information
      </h2>
      {!editMode && (
        <Button
          onClick={() => setEditMode(true)}
          variant="outline"
          icon={Edit2}
        >
          Edit Profile
        </Button>
      )}
    </div>

    {/* Account Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Package className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {accountStats.totalOrders}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <CreditCard className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(accountStats.totalSpent)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Star className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {accountStats.loyaltyPoints}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loyalty Points</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Calendar className="w-8 h-8 text-orange-600 mr-3" />
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatDate(accountStats.memberSince)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
          </div>
        </div>
      </div>
    </div>

    {editMode ? (
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <select
              value={profileData.gender}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="flex space-x-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            icon={Save}
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditMode(false)}
            icon={X}
          >
            Cancel
          </Button>
        </div>
      </form>
    ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              First Name
            </label>
            <p className="text-gray-900 dark:text-white">
              {profileData.firstName || 'Not provided'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Last Name
            </label>
            <p className="text-gray-900 dark:text-white">
              {profileData.lastName || 'Not provided'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{profileData.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Phone Number
            </label>
            <p className="text-gray-900 dark:text-white">
              {profileData.phone || 'Not provided'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date of Birth
            </label>
            <p className="text-gray-900 dark:text-white">
              {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Gender
            </label>
            <p className="text-gray-900 dark:text-white capitalize">
              {profileData.gender || 'Not provided'}
            </p>
          </div>
        </div>

        {profileData.bio && (
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Bio
            </label>
            <p className="text-gray-900 dark:text-white">{profileData.bio}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

// Addresses Tab Component
const AddressesTab = ({ addresses, onAdd, onEdit, onDelete }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Saved Addresses
      </h2>
      <Button onClick={onAdd} icon={Plus}>
        Add Address
      </Button>
    </div>

    {addresses.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div
            key={address._id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {address.label || 'Address'}
                </h3>
                {address.isDefault && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                    Default
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(address._id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(address._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>{address.firstName} {address.lastName}</p>
              <p>{address.address}</p>
              <p>{address.city}, {address.county}</p>
              <p>{address.phone}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No addresses saved
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add an address to make checkout faster
        </p>
        <Button onClick={onAdd} icon={Plus}>
          Add Your First Address
        </Button>
      </div>
    )}
  </div>
);

// Payment Methods Tab Component
const PaymentMethodsTab = ({ paymentMethods, setPaymentMethods }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Payment Methods
      </h2>
      <Button icon={Plus}>
        Add Payment Method
      </Button>
    </div>

    {paymentMethods.length > 0 ? (
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method._id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  **** **** **** {method.lastFour}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expires {method.expiryMonth}/{method.expiryYear}
                </p>
              </div>
              {method.isDefault && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Default
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No payment methods saved
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add a payment method for faster checkout
        </p>
        <Button icon={Plus}>
          Add Payment Method
        </Button>
      </div>
    )}
  </div>
);

// Orders Tab Component
const OrdersTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recent Orders
        </h2>
        <Button onClick={() => navigate('/orders')} variant="outline">
          View All Orders
        </Button>
      </div>

      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Your recent orders will appear here
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Once you place an order, you can track it from this page
        </p>
        <Button onClick={() => navigate('/products')} variant="primary">
          Start Shopping
        </Button>
      </div>
    </div>
  );
};

// Wishlist Tab Component
const WishlistTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Wishlist
        </h2>
        <Button onClick={() => navigate('/wishlist')} variant="outline">
          View All
        </Button>
      </div>

      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Your wishlist is empty
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Save items you love for later
        </p>
        <Button onClick={() => navigate('/products')} variant="primary">
          Browse Products
        </Button>
      </div>
    </div>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ notifications, onUpdate }) => {
  const handleToggle = (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    onUpdate(newNotifications);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Order Updates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get notified about order status changes
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.orderUpdates}
              onChange={() => handleToggle('orderUpdates')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Promotions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive promotional offers and discounts
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.promotions}
              onChange={() => handleToggle('promotions')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Newsletter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stay updated with our latest news and products
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.newsletter}
              onChange={() => handleToggle('newsletter')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">SMS Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive important updates via SMS
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={() => handleToggle('sms')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

// Security Tab Component
const SecurityTab = ({ 
  passwordData, 
  setPasswordData, 
  passwordChangeMode, 
  setPasswordChangeMode, 
  onPasswordChange, 
  showPassword, 
  setShowPassword, 
  loading 
}) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      Security Settings
    </h2>

    <div className="space-y-8">
      {/* Password Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last changed 30 days ago
            </p>
          </div>
          {!passwordChangeMode && (
            <Button
              onClick={() => setPasswordChangeMode(true)}
              variant="outline"
              icon={Lock}
            >
              Change Password
            </Button>
          )}
        </div>

        {passwordChangeMode && (
          <form onSubmit={onPasswordChange} className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.current ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.new ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.confirm ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                icon={Save}
              >
                Update Password
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordChangeMode(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                icon={X}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button variant="outline" icon={Smartphone}>
            Enable 2FA
          </Button>
        </div>
      </div>

      {/* Login Sessions */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your active login sessions
            </p>
          </div>
          <Button variant="outline">
            View All Sessions
          </Button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">MacBook Air • Chrome • Nairobi, Kenya</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Preferences Tab Component
const PreferencesTab = ({ privacy, onPrivacyUpdate, theme, onThemeToggle }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      Preferences
    </h2>

    <div className="space-y-8">
      {/* Theme */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Theme</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred theme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-gray-400" />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={onThemeToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            <Moon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Privacy</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Profile Visibility</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control who can see your profile information
              </p>
            </div>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => onPrivacyUpdate({ ...privacy, profileVisibility: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Purchase History</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow others to see your purchase history
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.showPurchaseHistory}
                onChange={(e) => onPrivacyUpdate({ ...privacy, showPurchaseHistory: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Product Reviews</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow others to see your product reviews
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.allowReviews}
                onChange={(e) => onPrivacyUpdate({ ...privacy, allowReviews: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download a copy of your account data
              </p>
            </div>
            <Button variant="outline" icon={Download}>
              Download Data
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-red-600">Delete Account</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProfilePage;