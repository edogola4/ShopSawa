// frontend/src/pages/HomePage.js - FINAL WORKING VERSION

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShoppingBag, 
  Truck, 
  Shield, 
  Headphones, 
  Star,
  TrendingUp,
  Gift,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import productService from '../services/product.service';

const HomePage = () => {
  const navigate = useNavigate(); // ✅ ADDED: Navigation hook
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIXED: Get products using correct data path
      console.log('🚀 HomePage - Loading products...');
      
      // Try featured products first
      const featuredResponse = await productService.getProducts({ 
        featured: true, 
        limit: 8,
        status: 'active'
      });
      
      // ✅ FIXED: Products are directly in response.data after API normalization
      const featuredProductsList = Array.isArray(featuredResponse.data) ? featuredResponse.data : [];
      setFeaturedProducts(featuredProductsList);

      // If no featured products, get regular products
      let allProductsList = [];
      if (featuredProductsList.length === 0) {
        const allResponse = await productService.getProducts({ 
          limit: 8,
          status: 'active',
          sort: '-createdAt'
        });
        
        // ✅ FIXED: Products are directly in response.data after API normalization
        allProductsList = Array.isArray(allResponse.data) ? allResponse.data : [];
        setAllProducts(allProductsList);
      }

      // Load categories
      const categoriesResponse = await productService.getCategories();
      console.log('📚 Categories Response Structure:', categoriesResponse);
      
      // ✅ FIXED: Handle different possible category response structures
      let categoriesList = [];
      
      if (Array.isArray(categoriesResponse.data)) {
        // Case 1: Categories directly in data array
        categoriesList = categoriesResponse.data;
      } else if (categoriesResponse.data?.categories) {
        // Case 2: Categories in data.categories
        categoriesList = categoriesResponse.data.categories;
      } else if (categoriesResponse.categories) {
        // Case 3: Categories at root level
        categoriesList = categoriesResponse.categories;
      } else if (categoriesResponse.data) {
        // Case 4: Check if data itself contains category objects
        const dataValues = Object.values(categoriesResponse.data);
        const possibleCategories = dataValues.find(val => Array.isArray(val));
        if (possibleCategories) {
          categoriesList = possibleCategories;
        }
      }
      
      console.log('📂 Extracted categories:', categoriesList.length, 'items');
      console.log('🏷️ Sample category:', categoriesList[0]);
      
      setCategories(categoriesList.slice(0, 6));

      console.log('✅ HomePage - Data loaded:', {
        featuredProducts: featuredProductsList.length,
        allProducts: allProductsList.length,
        categories: categoriesList.length,
        sampleCategory: categoriesList[0] || 'No categories found'
      });

    } catch (error) {
      console.error('❌ HomePage - Failed to load data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: ProductCard with proper image handling
  const ProductCard = ({ product }) => {
    // ✅ FIXED: Handle image URLs properly
    const getImageUrl = (image) => {
      if (!image) return null;
      
      // If image is a string and starts with /uploads, prepend backend URL
      if (typeof image === 'string') {
        if (image.startsWith('/uploads')) {
          return `http://localhost:5001${image}`;
        }
        if (image.startsWith('uploads/')) {
          return `http://localhost:5001/${image}`;
        }
        return image; // Return as-is if it's a full URL
      }
      
      // If image is an object with url property
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
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('❌ Image failed to load:', e.target.src);
                // Hide the broken image and show placeholder
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center bg-gray-100"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name || 'Unnamed Product'}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over KSh 2,000',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Your payments are safe with us',
      color: 'green'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Get help whenever you need it',
      color: 'purple'
    },
    {
      icon: Gift,
      title: 'Easy Returns',
      description: '30-day return policy',
      color: 'orange'
    }
  ];

  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Star },
    { label: 'Products', value: '5,000+', icon: ShoppingBag },
    { label: 'Categories', value: '50+', icon: TrendingUp },
    { label: 'Orders Delivered', value: '25,000+', icon: Zap }
  ];

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

  // Determine which products to show
  const productsToShow = featuredProducts.length > 0 ? featuredProducts : allProducts;
  const productsTitle = featuredProducts.length > 0 ? 'Featured Products' : 'Latest Products';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ShopSawa
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices. Shop the latest trends and get them delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  console.log('🚀 Start Shopping clicked - navigating to /products');
                  navigate('/products');
                }}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4"
                icon={ShoppingBag}
              >
                Start Shopping
              </Button>
              <Button
                onClick={() => {
                  console.log('🚀 Browse Categories clicked - navigating to /categories');
                  navigate('/categories');
                }}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4"
                icon={ArrowRight}
              >
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex p-3 rounded-full mb-4 bg-${feature.color}-100`}>
                    <Icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 ? (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category ({categories.length})
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore our wide range of categories and find exactly what you're looking for
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => {
                console.log(`🏷️ Rendering category ${index + 1}:`, category);
                return (
                  <Link
                    key={category._id || index}
                    to={`/products?category=${category._id}`}
                    className="group text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                      {category.name?.charAt(0) || category.title?.charAt(0) || '?'}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name || category.title || 'Unnamed Category'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.productCount || category.products?.length || 0} items
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Categories</h2>
              <p className="text-gray-600 mb-6">
                We have 10 categories in the backend, but they're not displaying properly.
                <br />Check the console for debugging info.
              </p>
              <Button onClick={loadHomeData}>Refresh Categories</Button>
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {productsTitle}
              </h2>
              <p className="text-gray-600">
                {featuredProducts.length > 0 
                  ? 'Discover our handpicked selection of trending products'
                  : 'Check out our latest products'
                }
              </p>
            </div>
            <Button
              onClick={() => navigate('/products')} // ✅ FIXED: Direct navigation
              variant="outline"
              icon={ArrowRight}
              className="hidden md:flex"
            >
              View All Products
            </Button>
          </div>

          {productsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {productsToShow.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products available yet
              </h3>
              <p className="text-gray-600 mb-6">
                Check back soon for amazing products or browse our categories!
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={loadHomeData}>
                  Refresh
                </Button>
                <Button as={Link} to="/products" variant="outline" icon={ArrowRight}>
                  Browse All Products
                </Button>
              </div>
            </div>
          )}

          <div className="text-center md:hidden">
            <Button
              onClick={() => navigate('/products')} // ✅ FIXED: Direct navigation
              variant="outline"
              icon={ArrowRight}
              className="mt-6"
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Join our growing community of satisfied customers who trust ShopSawa for their shopping needs
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                  <div className="text-3xl md:text-4xl font-bold mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-100">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter and be the first to know about new products, special offers, and exclusive deals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={() => console.log('Newsletter subscription clicked')}
                className="px-8"
              >
                Subscribe
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;