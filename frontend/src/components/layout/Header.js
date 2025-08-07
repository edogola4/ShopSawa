// frontend/src/components/layout/Header.js - ENHANCED UI/UX

/**
 * =============================================================================
 * HEADER COMPONENT - ENHANCED UI/UX
 * =============================================================================
 * Modern navigation header with enhanced search, user menu, and mobile support
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  Package,
  LogOut,
  FileText,
  Heart,
  MapPin,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Clock,
  Star,
  ShoppingBag,
  Settings,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import productService from '../../services/product.service';

import Button from '../common/Button';
import EnhancedSearchBar from '../common/EnhancedSearchBar';
import { NotificationBadge } from '../common/Notification';
import NotificationDrawer from '../notifications/NotificationDrawer';
import { getInitials } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

// Memoized UserMenu component to prevent unnecessary re-renders
const UserMenu = memo(({ user, onClose, onLogout, authLoading }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const menuItems = [
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile & Account',
      onClick: () => navigate('/profile'),
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: 'My Orders',
      onClick: () => navigate('/orders'),
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: 'Wishlist',
      onClick: () => navigate('/wishlist'),
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Addresses',
      onClick: () => navigate('/profile/addresses'),
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Order History',
      onClick: () => navigate('/orders?filter=history'),
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
      >
        {/* User Info */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.fullName || `${user.firstName} ${user.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                {getInitials(`${user?.firstName} ${user?.lastName}`)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
              <div className="flex items-center mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <Star className="w-3 h-3 mr-1" />
                  Premium Member
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-gray-500 dark:text-gray-400 mr-3">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                navigate('/help');
                onClose();
              }}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                onClose();
              }}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
          <button
            onClick={onLogout}
            disabled={authLoading}
            className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {authLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </motion.div>
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

const Header = () => {
  const navigate = useNavigate();
  
  const { 
    user, 
    isAuthenticated, 
    logout, 
    loading: authLoading 
  } = useAuth();
  
  const { 
    cartItemCount, 
    openDrawer 
  } = useCart();
  
  const {
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    toggleMobileMenu,
    mobileMenuOpen
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const headerRef = useRef(null);

  // Search functionality with debouncing
  const {
    query,
    results: searchResults,
    loading: searchLoading,
    search: performSearch,
    clearSearch
  } = useDebouncedSearch(
    useCallback(async (query) => {
      try {
        const response = await productService.searchProducts(query, { limit: 5 });
        return response.success ? response.data : [];
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    }, []),
    300,
    { minLength: 2 }
  );

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
  }, [performSearch, setSearchQuery]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }
  }, [query, navigate]);

  // Handle search result click
  const handleSearchResultClick = useCallback((product) => {
    navigate(`/products/${product._id}`);
    clearSearch();
  }, [navigate, clearSearch]);

  // Handle user logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  // Toggle user menu
  const toggleUserMenu = useCallback(() => {
    setShowUserMenu(prev => !prev);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        headerRef.current?.classList.add('shadow-md');
      } else {
        headerRef.current?.classList.remove('shadow-md');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      ref={headerRef}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-shadow duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 group"
              aria-label="Home"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
                ShopSawa
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <EnhancedSearchBar
              query={query}
              searchLoading={searchLoading}
              searchResults={searchResults}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              onResultClick={handleSearchResultClick}
              onClearSearch={clearSearch}
              placeholder="Search for products, brands, and more..."
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              tooltip={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </Button>

            {/* Notifications (when authenticated) */}
            {isAuthenticated && <NotificationDrawer />}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openDrawer}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              aria-label={`Shopping cart (${cartItemCount} items)`}
              tooltip={`Cart (${cartItemCount})`}
            >
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {cartItemCount > 0 && (
                <NotificationBadge count={cartItemCount} size="xs" />
              )}
            </Button>

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative" ref={headerRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.fullName || `${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-colors"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(`${user?.firstName} ${user?.lastName}`)}
                    </div>
                  )}
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'transform rotate-180' : ''}`} 
                  />
                </Button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <UserMenu 
                      user={user} 
                      onClose={() => setShowUserMenu(false)} 
                      onLogout={handleLogout} 
                      authLoading={authLoading} 
                    />
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 text-sm font-medium"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="px-4 py-1.5 text-sm font-medium"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/');
                    toggleMobileMenu();
                  }}
                  className="w-full flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5 mr-3 text-gray-500" />
                  Home
                </button>

                <button
                  onClick={() => {
                    navigate('/products');
                    toggleMobileMenu();
                  }}
                  className="w-full flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 mr-3 text-gray-500" />
                  Browse Products
                </button>

                {!isAuthenticated ? (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={() => {
                        navigate('/login');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigate('/register');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <User className="w-5 h-5 mr-3 text-gray-500" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate('/orders');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5 mr-3 text-gray-500" />
                      My Orders
                    </button>

                    <button
                      onClick={() => {
                        navigate('/wishlist');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Heart className="w-5 h-5 mr-3 text-gray-500" />
                      Wishlist
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      {authLoading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default memo(Header);