// frontend/src/components/layout/Header.js - FIXED NAVIGATION

/**
 * =============================================================================
 * HEADER COMPONENT - FIXED FOR NAVIGATION
 * =============================================================================
 * Main navigation header with search, user menu, cart, and mobile support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADDED: Direct React Router navigation
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  Package,
  LogOut,
  Settings,
  FileText,
  Heart,
  MapPin,
  Bell,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import productService from '../../services/product.service';

import Button from '../common/Button';
import { NotificationBadge } from '../common/Notification';
import { getInitials } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const Header = () => {
  const navigate = useNavigate(); // ✅ FIXED: Use React Router's navigate directly
  
  const { 
    user, 
    isAuthenticated, 
    logout, 
    loading: authLoading 
  } = useAuth();
  
  const { 
    cartItemCount, 
    openDrawer: openCartDrawer 
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
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Search functionality
  const {
    query,
    results: searchResults,
    loading: searchLoading,
    search: performSearch,
    clearSearch
  } = useDebouncedSearch(
    async (query) => {
      try {
        const response = await productService.searchProducts(query, { limit: 8 });
        return response.success ? response.data : [];
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    300,
    { minLength: 2 }
  );

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
    setShowSearchResults(value.length >= 2);
  };

  // Handle search result click
  const handleSearchResultClick = (product) => {
    navigate(`/products/${product._id}`);
    clearSearch();
    setShowSearchResults(false);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setShowSearchResults(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold hidden sm:block">ShopSawa</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSearchResultClick(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                      >
                        <img
                          src={product.images?.[0]?.url || '/api/placeholder/40/40'}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                            KES {product.price.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                      <button
                        onClick={() => {
                          navigate(`/products?search=${encodeURIComponent(query)}`);
                          setShowSearchResults(false);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        View all results for "{query}"
                      </button>
                    </div>
                  </>
                ) : query.length >= 2 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No products found for "{query}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            {/* Notifications (when authenticated) */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge placeholder */}
                <NotificationBadge count={0} size="sm" />
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCartDrawer}
              className="p-2 relative"
              aria-label={`Shopping cart (${cartItemCount} items)`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <NotificationBadge count={cartItemCount} size="sm" />
              )}
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.fullName || `${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(`${user?.firstName} ${user?.lastName}`)}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </button>

                      <button
                        onClick={() => {
                          navigate('/orders');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        My Orders
                      </button>

                      <button
                        onClick={() => {
                          navigate('/wishlist');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Wishlist
                      </button>

                      <button
                        onClick={() => {
                          navigate('/profile/addresses');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4 mr-3" />
                        Addresses
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                      <button
                        onClick={handleLogout}
                        disabled={authLoading}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {authLoading ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')} // ✅ FIXED: Direct navigation
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')} // ✅ FIXED: Direct navigation
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
              className="md:hidden p-2"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-2 space-y-1">
            
            {/* Mobile Navigation Links */}
            <button
              onClick={() => {
                navigate('/');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Package className="w-5 h-5 mr-3" />
              Home
            </button>

            <button
              onClick={() => {
                navigate('/products');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Search className="w-5 h-5 mr-3" />
              Browse Products
            </button>

            {/* Mobile Auth Links */}
            {!isAuthenticated && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button
                  onClick={() => {
                    navigate('/login'); // ✅ FIXED: Direct navigation
                    toggleMobileMenu();
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <User className="w-5 h-5 mr-3" />
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate('/register'); // ✅ FIXED: Direct navigation
                    toggleMobileMenu();
                  }}
                  className="flex items-center w-full px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors font-medium"
                >
                  <User className="w-5 h-5 mr-3" />
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile User Menu */}
            {isAuthenticated && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate('/profile');
                    toggleMobileMenu();
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </button>

                <button
                  onClick={() => {
                    navigate('/orders');
                    toggleMobileMenu();
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  My Orders
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  disabled={authLoading}
                  className="flex items-center w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {authLoading ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;