// frontend/src/hooks/useProduct.js 

import { useState, useEffect } from 'react';
import productService from '../services/product.service';

export const useProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }

    return () => {
      // Cleanup function if needed
    };
  }, [productId]);

  return { product, loading, error };
};

export default useProduct;
