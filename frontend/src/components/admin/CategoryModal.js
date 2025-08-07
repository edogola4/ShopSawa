import React, { useState } from 'react';
import api from '../../services/api';

const CategoryModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setSlug('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    
    if (!trimmedName) {
      setError('Category name is required');
      return;
    }
    
    // Basic validation: check if name contains only letters, numbers, and spaces
    if (!/^[a-zA-Z0-9\s-]+$/.test(trimmedName)) {
      setError('Category name can only contain letters, numbers, and spaces');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = { 
        name: trimmedName,
        ...(trimmedSlug && { slug: trimmedSlug })
      };
      
      console.log('Sending payload:', payload);
      
      const res = await api.post('/admin/categories', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response:', res);
      
      // Reset form and close modal on success
      reset();
      onCreated(res.data?.category || res.data?.data?.category || res.data);
      onClose();
      
    } catch (err) {
      console.error('Create category error', err);
      
      // Handle duplicate category error
      if (err.message && (err.message.includes('duplicate key error') || 
                         (err.response?.data?.error?.code === 11000))) {
        setError(`A category named "${name}" already exists. Please choose a different name.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create category');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">New Category</h3>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              placeholder="optional"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
