// frontend/src/pages/ProductDetail.js - DEBUG VERSION

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Plus, 
  Minus, 
  Truck, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductCard from '../components/product/ProductCard';
import { productService } from '../services/product.service';
import { useCart } from '../context/SimpleCartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, isLoading: cartLoading } = useCart(); // Add cartLoading to check cart state
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // DEBUG: Log cart context state
  console.log('Cart context values:', { addItem, cartLoading });
  console.log('Product:', product);
  console.log('Adding to cart state:', addingToCart);

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      
      const [productResponse, relatedResponse] = await Promise.all([
        productService.getProduct(id),
        productService.getProducts({ limit: 4, exclude: id })
      ]);

      setProduct(productResponse.data.product);
      setRelatedProducts(relatedResponse.data.products || []);
    } catch (error) {
      console.error('Failed to load product:', error);
      showNotification('error', 'Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    console.log('🚀 handleAddToCart called!'); // DEBUG
    console.log('Product data:', product); // DEBUG
    console.log('Quantity:', quantity); // DEBUG
    console.log('addItem function:', addItem); // DEBUG

    // Check if addItem exists
    if (!addItem) {
      console.error('❌ addItem function is not available');
      alert('Cart function not available. Please refresh the page.');
      return;
    }

    // Check if product exists
    if (!product) {
      console.error('❌ Product data is not available');
      alert('Product data not loaded. Please refresh the page.');
      return;
    }

    try {
      console.log('⏳ Setting addingToCart to true');
      setAddingToCart(true);
      
      console.log('🛒 Calling addItem with:', { product: product.name, quantity });
      const result = await addItem(product, quantity);
      
      console.log('✅ addItem result:', result);
      
      if (result && result.success) {
        console.log('🎉 Success! Showing notification');
        showNotification('success', `${product.name} added to cart!`);
      } else {
        console.log('⚠️ addItem returned unsuccessful result:', result);
        showNotification('error', result?.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('💥 Add to cart error:', error);
      showNotification('error', 'Failed to add item to cart');
      
      // Show more detailed error to user for debugging
      alert(`Debug Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      console.log('🏁 Setting addingToCart to false');
      setAddingToCart(false);
    }
  };

  // TEST BUTTON - Remove this after debugging
  const testButton = () => {
    console.log('🧪 Test button clicked!');
    alert('Test button works!');
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      showNotification('info', 'Please login to add items to wishlist');
      return;
    }

    try {
      setWishlistLoading(true);
      showNotification('info', 'Wishlist feature coming soon!');
    } catch (error) {
      showNotification('error', 'Failed to add to wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Product link copied to clipboard!');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Button as={Link} to="/products">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const hasImages = product.images && product.images.length > 0;
  const currentImage = hasImages ? product.images[selectedImageIndex] : null;
  const productPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const averageRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: `Reviews (${reviewCount})` },
    { id: 'shipping', label: 'Shipping & Returns' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* DEBUG SECTION - Remove after fixing */}
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p><strong>Debug Info:</strong></p>
          <p>addItem function: {addItem ? '✅ Available' : '❌ Not Available'}</p>
          <p>Product loaded: {product ? '✅ Yes' : '❌ No'}</p>
          <p>Adding to cart: {addingToCart ? '🔄 Yes' : '⭕ No'}</p>
          <button 
            onClick={testButton}
            className="bg-yellow-500 text-white px-2 py-1 rounded text-sm mt-2"
          >
            Test Button Click
          </button>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link 
                to={`/products?category=${product.category._id}`}
                className="hover:text-blue-600"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-lg shadow-sm overflow-hidden aspect-square">
              {hasImages ? (
                <>
                  <img
                    src={currentImage.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/600/600';
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      -{discountPercentage}%
                    </div>
                  )}

                  {/* Image Navigation */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center text-gray-500">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {hasImages && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddToWishlist}
                    loading={wishlistLoading}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Category */}
              {product.category && (
                <Link 
                  to={`/products?category=${product.category._id}`}
                  className="inline-block text-blue-600 hover:text-blue-700 font-medium text-sm mb-2"
                >
                  {product.category.name}
                </Link>
              )}

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < averageRating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {averageRating > 0 ? averageRating : 'No rating'}
                </span>
                {reviewCount > 0 && (
                  <span className="text-sm text-gray-500">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(productPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-green-600 font-medium">
                  You save {formatCurrency(product.price - productPrice)} ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.stock > 0 ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left in stock`}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 text-center min-w-[60px] font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.stock} available
                  </span>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                loading={addingToCart}
                disabled={product.stock === 0 || addingToCart}
                className="w-full"
                size="lg"
                icon={ShoppingCart}
              >
                {addingToCart 
                  ? 'Adding to Cart...' 
                  : product.stock === 0
                    ? 'Out of Stock'
                    : 'Add to Cart'
                }
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => showNotification('info', 'Buy now feature coming soon!')}
              >
                Buy It Now
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Free shipping over KSh 2,000</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Secure payments</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <RefreshCw className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component remains the same... */}
        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description || 'No description available for this product.'}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium">Brand</span>
                      <span className="text-gray-600">{product.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium">Category</span>
                      <span className="text-gray-600">{product.category?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium">SKU</span>
                      <span className="text-gray-600">{product.sku || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium">Weight</span>
                      <span className="text-gray-600">{product.weight || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping & Returns</h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-medium mb-2">Shipping Information</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Free shipping on orders over KSh 2,000</li>
                      <li>Standard delivery: 2-5 business days</li>
                      <li>Express delivery: 1-2 business days (additional charges apply)</li>
                      <li>We ship within Kenya only</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Return Policy</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>30-day return policy</li>
                      <li>Items must be in original condition</li>
                      <li>Return shipping costs may apply</li>
                      <li>Refunds processed within 3-5 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <Button
                as={Link}
                to="/products"
                variant="outline"
                size="sm"
              >
                View All Products
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;