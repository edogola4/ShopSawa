// frontend/src/pages/HomePage.js - ENHANCED UI VERSION

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ShoppingBag, 
  Truck, 
  Shield, 
  Headphones, 
  Star,
  TrendingUp,
  Gift,
  Zap,
  ArrowUp,
  Check,
  Tag,
  Clock,
  ShieldCheck,
  RefreshCw,
  Mail
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import productService from '../services/product.service';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 HomePage - Loading products...');
      
      const featuredResponse = await productService.getProducts({ 
        featured: true, 
        limit: 8,
        status: 'active'
      });
      
      const featuredProductsList = Array.isArray(featuredResponse.data) ? featuredResponse.data : [];
      setFeaturedProducts(featuredProductsList);

      let allProductsList = [];
      if (featuredProductsList.length === 0) {
        const allResponse = await productService.getProducts({ 
          limit: 8,
          status: 'active',
          sort: '-createdAt'
        });
        
        allProductsList = Array.isArray(allResponse.data) ? allResponse.data : [];
        setAllProducts(allProductsList);
      }

      // Get categories with product counts
      console.log('🔄 Fetching categories with product counts...');
      const categoriesResponse = await productService.getCategoriesWithCounts();
      console.log('📊 Categories with counts (raw response):', JSON.stringify(categoriesResponse, null, 2));
      
      let categoriesList = [];
      
      // Handle different response structures
      if (Array.isArray(categoriesResponse.data)) {
        categoriesList = categoriesResponse.data;
      } else if (categoriesResponse.data?.categories) {
        categoriesList = categoriesResponse.data.categories;
      } else if (categoriesResponse.categories) {
        categoriesList = categoriesResponse.categories;
      } else if (categoriesResponse.data) {
        const dataValues = Object.values(categoriesResponse.data);
        const possibleCategories = dataValues.find(val => Array.isArray(val));
        if (possibleCategories) {
          categoriesList = possibleCategories;
        }
      }
      
      console.log('📂 Extracted categories with counts:', categoriesList.length, 'items');
      console.log('🏷️ Sample category with count (full object):', JSON.stringify(categoriesList[0], null, 2));
      
      // Log all categories with their counts
      console.log('🔍 All categories with their counts:');
      categoriesList.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat._id}):`, {
          productCount: cat.productCount,
          count: cat.count,
          total: cat.total,
          productsLength: cat.products?.length,
          rawData: cat
        });
        
        console.log(`Category ${index + 1}:`, {
          name: cat.name,
          id: cat._id || cat.id,
          productCount: cat.productCount,
          total: cat.total,
          count: cat.count,
          products: cat.products ? cat.products.length : 'none'
        });
      });
      
      // Limit to 6 categories for display
      setCategories(categoriesList.slice(0, 6));

      console.log('✅ HomePage - Data loaded:', {
        featuredProducts: featuredProductsList.length,
        allProducts: allProductsList.length,
        categories: categoriesList.length,
      });

    } catch (error) {
      console.error('❌ HomePage - Failed to load data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkScroll = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [showScroll]);

  useEffect(() => {
    if (features.length > 1) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getImageUrl = (image) => {
      if (!image) return null;
      
      if (typeof image === 'string') {
        if (image.startsWith('/uploads')) {
          return `http://localhost:5001${image}`;
        }
        if (image.startsWith('uploads/')) {
          return `http://localhost:5001/${image}`;
        }
        return image; 
      }
      
      if (image.url) {
        if (image.url.startsWith('/uploads')) {
          return `http://localhost:5001${image.url}`;
        }
        if (image.url.startsWith('uploads/')) {
          return `http://localhost:5001/${image.url}`;
        }
        return image.url;
      }
      
      return null;
    };

    const imageUrl = product.images && product.images.length > 0 
      ? getImageUrl(product.images[0])
      : null;
    
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
        whileHover={{ y: -5 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden">
          <div className="aspect-w-1 aspect-h-1 w-full h-64 bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
              style={{ display: imageUrl ? 'none' : 'flex' }}
            >
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
            
            {product.onSale && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                SALE
              </div>
            )}
            
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              initial={{ y: '100%' }}
              whileHover={{ y: 0 }}
            >
              <button 
                className="w-full bg-white text-gray-900 font-medium py-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add to cart logic here
                }}
              >
                Add to Cart
              </button>
            </motion.div>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {product.name || 'Unnamed Product'}
            </h3>
            {product.rating && (
              <div className="flex items-center bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded">
                <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                {product.rating.toFixed(1)}
              </div>
            )}
          </div>
          
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-blue-600">
                KES {product.price?.toLocaleString() || 'N/A'}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  KES {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <Link
              to={`/products/${product._id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              View Details <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  const features = [
    {
      icon: Truck,
      title: 'Free & Fast Shipping',
      description: 'Free shipping on all orders over KSh 2,000',
      color: 'blue',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'hover:bg-blue-600',
      hoverTextColor: 'hover:text-white'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payments',
      description: '100% secure payment with SSL encryption',
      color: 'green',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBgColor: 'hover:bg-green-600',
      hoverTextColor: 'hover:text-white'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support team ready to help',
      color: 'purple',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'hover:bg-purple-600',
      hoverTextColor: 'hover:text-white'
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day hassle-free returns',
      color: 'orange',
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      hoverBgColor: 'hover:bg-orange-500',
      hoverTextColor: 'hover:text-white'
    }
  ];

  /**
   * @typedef {Object} StatItem
   * @property {string} label - The label for the statistic
   * @property {string} value - The value to display
   * @property {React.ComponentType} icon - The icon component to display
   */

  /** @type {StatItem[]} */
  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Star },
    { label: 'Products', value: '5,000+', icon: ShoppingBag },
    { label: 'Categories', value: '50+', icon: Tag },
    { label: 'Orders Delivered', value: '25,000+', icon: Truck }
  ];

  useEffect(() => {
    if (features.length > 1) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading homepage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <Button onClick={loadHomeData} className="mr-3">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const productsToShow = featuredProducts.length > 0 ? featuredProducts : allProducts;
  const productsTitle = featuredProducts.length > 0 ? 'Featured Products' : 'Latest Products';

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
        
        <div className="relative container mx-auto px-4 py-24 lg:py-36 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-white/20 backdrop-blur-sm text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                Welcome to ShopSawa
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Discover Amazing <span className="text-yellow-300">Deals</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Shop the latest trends at unbeatable prices. Quality products delivered to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate('/products')}
                    size="lg"
                    className="bg-black text-white hover:bg-blue-50 font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all"
                    icon={ShoppingBag}
                  >
                    Shop Now
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-white text-black hover:bg-black/10 font-semibold px-8 py-4 backdrop-blur-sm"
                    icon={ArrowRight}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section ref={featuresRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the best shopping experience with our premium services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className={`p-6 rounded-xl transition-all duration-300 ${feature.bgColor} hover:shadow-lg border border-transparent hover:border-${feature.color}-200`}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onHoverStart={() => setActiveFeature(index)}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${feature.bgColor} ${feature.hoverTextColor} transition-colors`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor} transition-colors`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 ? (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Browse through our wide range of product categories
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category._id || index}
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <Link
                    to={`/products?category=${category._id}`}
                    className="h-full flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3 group-hover:scale-110 transition-transform">
                      {category.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center text-sm md:text-base">
                      {category.name || category.title || 'Category'}
                    </h3>
                    <span className="text-xs text-gray-500 mt-1">
                      ({category.productCount || category.count || category.total || category.products?.length || 0} items)
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {featuredProducts.length > 0 ? 'Featured Products' : 'Latest Products'}
              </h2>
              <p className="text-gray-600 mt-2">
                Discover our handpicked selection of quality products
              </p>
            </div>
            <Button 
              onClick={() => navigate('/products')}
              variant="outline"
              className="flex items-center gap-2 group"
            >
              View All Products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : productsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsToShow.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-6">We couldn't find any products at the moment.</p>
              <Button onClick={loadHomeData}>Refresh Products</Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={index}
                  className="p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-blue-100 text-sm font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Get the latest updates on new products, upcoming sales, and exclusive offers.
            </p>
            
            {isSubscribed ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" />
                Thank you for subscribing!
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) {
                    // Add subscription logic here
                    setIsSubscribed(true);
                    setEmail('');
                  }
                }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <Button 
                  type="submit"
                  className="px-6 py-3 whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <motion.button
        className={`fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          showScroll ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={scrollToTop}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: showScroll ? 1 : 0,
          y: showScroll ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default HomePage;