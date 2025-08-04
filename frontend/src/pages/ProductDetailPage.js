
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/common/Button';
import { useCart } from '../context/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addToCart } = useCart();

  if (loading) return <div className="p-4 text-center">Loading product details...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading product: {error.message}</div>;
  if (!product) return <div className="p-4">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/2">
            <img 
              className="h-full w-full object-cover md:w-full" 
              src={product.image || '/images/placeholder-product.png'} 
              alt={product.name} 
            />
          </div>
          <div className="p-8">
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
                onClick={() => addToCart({ ...product, quantity: 1 })}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Add to Cart
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
