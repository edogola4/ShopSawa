// frontend/src/pages/OrderHistoryPage.js

// frontend/src/pages/OrderHistoryPage.js - COMPLETE ORDER HISTORY & MANAGEMENT

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RotateCcw, 
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Star,
  Calendar,
  CreditCard,
  MapPin,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { orderService } from '../services/order.service';
import { formatCurrency, formatDate } from '../utils/helpers';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useApp();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = useState(searchParams.get('dateRange') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const ordersPerPage = 10;

  const statusOptions = [
    { value: 'all', label: 'All Orders', count: 0 },
    { value: 'pending', label: 'Pending', count: 0, color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', count: 0, color: 'blue' },
    { value: 'processing', label: 'Processing', count: 0, color: 'purple' },
    { value: 'shipped', label: 'Shipped', count: 0, color: 'indigo' },
    { value: 'delivered', label: 'Delivered', count: 0, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', count: 0, color: 'red' },
    { value: 'returned', label: 'Returned', count: 0, color: 'gray' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last Year' }
  ];

  // Load orders on component mount and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, searchQuery, statusFilter, dateRange, currentPage]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateRange !== 'all') params.set('dateRange', dateRange);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  }, [searchQuery, statusFilter, dateRange, currentPage, setSearchParams]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: ordersPerPage,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dateRange: dateRange !== 'all' ? dateRange : undefined
      };

      const response = await orderService.getUserOrders(params);
      
      if (response.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalOrders(response.data.total || 0);
      } else {
        throw new Error(response.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load order history'
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeFilter = (range) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleReorder = async (orderId) => {
    try {
      const response = await orderService.reorder(orderId);
      
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Items Added to Cart',
          message: 'Order items have been added to your cart'
        });
        navigate('/cart');
      } else {
        throw new Error(response.message || 'Failed to reorder');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to reorder items'
      });
    }
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/orders/${orderId}/tracking`);
  };

  const handleReturnRequest = (orderId) => {
    navigate(`/orders/${orderId}/return`);
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await orderService.downloadInvoice(orderId);
      
      if (response.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Failed to download invoice');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to download invoice'
      });
    }
  };

  const handleWriteReview = (productId, orderId) => {
    navigate(`/products/${productId}?review=true&order=${orderId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to view your order history
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
            Order History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your orders
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={showFilters ? ChevronDown : Filter}
              >
                Filters
              </Button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => handleDateRangeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => handleDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                >
                  {dateRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `Showing ${orders.length} of ${totalOrders} orders`}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrders.has(order._id)}
                onToggleExpansion={() => toggleOrderExpansion(order._id)}
                onViewOrder={() => handleViewOrder(order._id)}
                onReorder={() => handleReorder(order._id)}
                onTrackOrder={() => handleTrackOrder(order._id)}
                onReturnRequest={() => handleReturnRequest(order._id)}
                onDownloadInvoice={() => handleDownloadInvoice(order._id)}
                onWriteReview={handleWriteReview}
              />
            ))
          ) : (
            <EmptyOrdersState 
              hasFilters={searchQuery || statusFilter !== 'all' || dateRange !== 'all'}
              onClearFilters={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRange('all');
                setCurrentPage(1);
              }}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              size="sm"
            >
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const showPage = page === 1 || page === totalPages || 
                               (page >= currentPage - 2 && page <= currentPage + 2);
                
                if (!showPage) {
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                    size="sm"
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  isExpanded, 
  onToggleExpansion, 
  onViewOrder, 
  onReorder, 
  onTrackOrder, 
  onReturnRequest, 
  onDownloadInvoice,
  onWriteReview 
}) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      processing: RefreshCw,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
      returned: RotateCcw
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const canTrack = ['confirmed', 'processing', 'shipped'].includes(order.status);
  const canReturn = order.status === 'delivered' && order.canReturn;
  const canReorder = !['pending', 'cancelled'].includes(order.status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Order Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order #{order.orderNumber}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(order.total)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Order Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewOrder}
            icon={Eye}
          >
            View Details
          </Button>

          {canTrack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTrackOrder}
              icon={Truck}
            >
              Track Order
            </Button>
          )}

          {canReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReorder}
              icon={RotateCcw}
            >
              Reorder
            </Button>
          )}

          {canReturn && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReturnRequest}
              icon={RefreshCw}
            >
              Return
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadInvoice}
            icon={Download}
          >
            Invoice
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpansion}
            icon={isExpanded ? ChevronDown : ChevronRight}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>

        {/* Order Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {order.items.length} items
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {order.paymentMethod.type === 'mpesa' ? 'M-Pesa' :
                 order.paymentMethod.type === 'card' ? 'Card' : 'Bank Transfer'}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.city}
              </span>
            </div>
          </div>

          {order.estimatedDelivery && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Expected: {formatDate(order.estimatedDelivery)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          {/* Items */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h4>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <OrderItem
                  key={index}
                  item={item}
                  order={order}
                  onWriteReview={onWriteReview}
                />
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Shipping Address
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.county}</p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Payment & Shipping
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Payment: {order.paymentMethod.type === 'mpesa' ? 'M-Pesa' :
                           order.paymentMethod.type === 'card' ? 'Credit Card' : 'Bank Transfer'}</p>
                <p>Shipping: {order.shippingMethod.name}</p>
                {order.trackingNumber && (
                  <p>Tracking: {order.trackingNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                Order Timeline
              </h5>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      event.status === order.status ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {event.status.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(event.timestamp)}
                      </p>
                      {event.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Order Item Component
const OrderItem = ({ item, order, onWriteReview }) => {
  const canReview = order.status === 'delivered' && !item.reviewed;

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <img
        src={item.product.image || '/images/placeholder-product.png'}
        alt={item.product.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <h5 className="font-medium text-gray-900 dark:text-white">
          {item.product.name}
        </h5>
        {item.variant && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Variant: {item.variant.name}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Qty: {item.quantity}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
          
          {canReview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWriteReview(item.product._id, order._id)}
              icon={Star}
            >
              Write Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty Orders State Component
const EmptyOrdersState = ({ hasFilters, onClearFilters }) => (
  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {hasFilters ? 'No orders found' : 'No orders yet'}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      {hasFilters 
        ? 'Try adjusting your filters to see more orders'
        : 'When you place orders, they will appear here'
      }
    </p>
    
    <div className="flex justify-center space-x-4">
      {hasFilters ? (
        <Button onClick={onClearFilters} variant="outline">
          Clear Filters
        </Button>
      ) : (
        <Button onClick={() => window.location.href = '/products'} variant="primary">
          Start Shopping
        </Button>
      )}
    </div>
  </div>
);

export default OrderHistoryPage;