// frontend/src/pages/ProductDetailPage.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/common/Button';
import { useCart } from '../context/SimpleCartContext';
import { useNotification } from '../hooks/useNotification';

const ProductDetailPage = () => {
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addItem } = useCart(); // FIXED: Changed from addToCart to addItem
  const { showNotification } = useNotification();

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      // FIXED: Use addItem with proper parameters
      const result = await addItem(product, 1); // quantity = 1
      
      if (result.success) {
        showNotification('success', `${product.name} added to cart!`);
      } else {
        showNotification('error', result.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showNotification('error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Get the first image URL or use a placeholder
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Handle image loading and errors
  useEffect(() => {
    if (!product) return;
    
    console.group('🖼️ Product Image Debug');
    console.log('Product data:', product);
    
    if (!product.images || product.images.length === 0) {
      console.warn('No images found for product');
      setCurrentImageUrl('');
      setImageLoadError(true);
      setIsImageLoading(false);
      console.groupEnd();
      return;
    }
    
    const imageUrl = getImageUrl(product.images[0]);
    console.log('🔄 Generated image URL:', imageUrl);
    
    // Only proceed if we have a valid URL
    if (!imageUrl) {
      console.warn('No valid image URL could be generated');
      setCurrentImageUrl('');
      setImageLoadError(true);
      setIsImageLoading(false);
      console.groupEnd();
      return;
    }
    
    setCurrentImageUrl(imageUrl);
    setIsImageLoading(true);
    setImageLoadError(false);
    
    // Test if the image loads
    const testImage = new Image();
    
    testImage.onload = () => {
      console.log('✅ Image loaded successfully');
      console.log('📏 Image dimensions:', testImage.naturalWidth, 'x', testImage.naturalHeight);
      console.log('🔗 Image URL:', testImage.src);
      setImageLoadError(false);
      setIsImageLoading(false);
      console.groupEnd();
    };
    
    testImage.onerror = (e) => {
      console.error('❌ Failed to load image');
      console.error('📛 Error details:', e);
      console.error('🔗 Failed URL:', testImage.src);
      console.error('🔄 Current origin:', window.location.origin);
      setImageLoadError(true);
      setIsImageLoading(false);
      console.groupEnd();
    };
    
    console.log('🔄 Loading test image...');
    testImage.src = imageUrl;
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up image handlers');
      testImage.onload = null;
      testImage.onerror = null;
    };
  }, [product]);

  if (loading) return <div className="p-4 text-center">Loading product details...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading product: {error.message}</div>;
  if (!product) return <div className="p-4">Product not found</div>;

  // Get the image URL - ensure it's an absolute URL
  const getImageUrl = (url) => {
    console.group('getImageUrl');
    console.log('Original URL:', url);
    
    if (!url) {
      console.warn('No URL provided, returning null');
      console.groupEnd();
      return null;
    }
    
    // If it's already an absolute URL, return as is
    if (url.startsWith('http')) {
      console.log('Absolute URL detected, returning as is');
      console.groupEnd();
      return url;
    }
    
    // Handle different URL formats
    const isLocalDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
    const backendUrl = isLocalDev ? 'http://localhost:5001' : '';
    
    // Clean up the URL
    let cleanUrl = url.replace(/^\/+/, ''); // Remove leading slashes
    
    // Special handling for uploads directory
    if (cleanUrl.startsWith('uploads/') || cleanUrl.startsWith('public/uploads/')) {
      cleanUrl = cleanUrl.replace(/^public\//, ''); // Remove 'public/' if present
      const fullUrl = `${backendUrl}/${cleanUrl}`.replace(/([^:]\/)\/+/g, '$1');
      console.log('Constructed uploads URL:', fullUrl);
      console.groupEnd();
      return fullUrl;
    }
    
    // For other relative URLs, use the current origin
    const fullUrl = new URL(cleanUrl, window.location.origin).toString();
    console.log('Constructed relative URL:', fullUrl);
    console.groupEnd();
    return fullUrl;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/2 p-4">
            <div 
              className="relative w-full bg-white border-2 border-dashed border-gray-200 rounded-lg overflow-hidden"
              style={{ height: '400px' }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-4">
                {isImageLoading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <div className="text-gray-600">Loading image...</div>
                    <div className="text-xs text-gray-500 mt-2 break-all max-w-full overflow-hidden text-ellipsis">
                      {currentImageUrl}
                    </div>
                  </div>
                ) : imageLoadError || !currentImageUrl ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="text-red-500 mb-2">
                      Failed to load image
                    </div>
                    {currentImageUrl && (
                      <div className="text-xs text-gray-600 mb-4 break-all max-w-full overflow-hidden text-ellipsis">
                        {currentImageUrl}
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        console.log('Retrying image load...');
                        setImageLoadError(false);
                        setIsImageLoading(true);
                        // Force re-render to retry loading
                        const url = currentImageUrl;
                        setCurrentImageUrl('');
                        setTimeout(() => setCurrentImageUrl(url), 100);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry Loading Image
                    </button>
                    <div className="mt-4 text-xs text-gray-500">
                      Check browser console for detailed error information
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={currentImageUrl}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                      onLoad={(e) => {
                        console.group('Image Loaded Successfully');
                        console.log('Image URL:', currentImageUrl);
                        console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                        console.log('Image element:', e.target);
                        console.groupEnd();
                      }}
                      onError={(e) => {
                        console.group('Image Load Error');
                        console.error('Failed to load image:', currentImageUrl);
                        console.error('Error event:', e);
                        console.error('Error target:', e.target);
                        console.error('Error target src:', e.target.src);
                        console.error('Error target currentSrc:', e.target.currentSrc);
                        console.groupEnd();
                        setImageLoadError(true);
                      }}
                      crossOrigin={currentImageUrl && currentImageUrl.startsWith('http') ? 'anonymous' : undefined}
                      style={{
                        boxSizing: 'border-box',
                        opacity: 1,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs break-all hidden md:block"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {currentImageUrl}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Debug information overlay */}
              <div className="absolute top-2 left-2 flex flex-col space-y-1">
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Images: {product.images?.length || 0}
                </div>
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Status: {!currentImageUrl ? 'No URL' : imageLoadError ? 'Error' : 'Loaded'}
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
              <div className="text-sm font-medium text-gray-700">Image URL:</div>
              <div className="text-xs text-gray-600 break-all p-2 bg-white rounded border mt-1">
                {currentImageUrl || 'No image URL available'}
              </div>
              <div className="mt-2">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded inline-block mb-2">
                  Status: {!currentImageUrl ? 'No URL' : imageLoadError ? 'Error' : 'Loaded'}
                </div>
                {currentImageUrl && (
                  <button 
                    onClick={() => window.open(currentImageUrl, '_blank')}
                    className="block w-full mt-2 text-xs text-blue-600 hover:text-blue-800 text-left"
                  >
                    Open image in new tab
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="p-8 flex-1">
            <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
              {product.category}
            </div>
            <h1 className="block mt-1 text-2xl font-medium text-gray-900">
              {product.name}
            </h1>
            <p className="mt-2 text-gray-600">
              {product.description}
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="mt-6">
              <Button
                onClick={handleAddToCart}
                loading={addingToCart}
                disabled={addingToCart}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </Button>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Details</h3>
              <div className="mt-4">
                <ul className="pl-4 list-disc text-sm space-y-2">
                  {product.details?.map((detail, index) => (
                    <li key={index} className="text-gray-600">
                      <span className="text-gray-900">{detail.label}:</span> {detail.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;