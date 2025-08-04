// frontend/src/components/auth/LoginForm.js - FIXED VERSION

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { validateEmail, validatePassword } from '../../utils/validators';

const LoginForm = ({ onSuccess, redirectTo = '/' }) => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        newErrors.email = emailError;
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password, rememberMe);
      
      showNotification('success', 'Welcome back! Login successful');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      showNotification('error', errorMessage);
      
      // Set specific field errors if provided by backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@shopsawa.com',
      password: 'demo123'
    });
    
    // Auto-submit after a brief delay to show the form populated
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">
          Sign in to your ShopSawa account
        </p>
      </div>

      {/* Demo Login Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Try Demo Account</p>
            <p className="text-xs text-blue-600">Quick login for testing</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            Demo Login
          </Button>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <Input
            type="email"
            name="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
            required
            autoComplete="email"
            className="w-full"
          />
        </div>

        {/* Password Field - FIXED VERSION */}
        <div>
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={Lock}
            required
            autoComplete="current-password"
            className="w-full"
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full"
          size="lg"
          icon={ArrowRight}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      {/* Divider */}
      <div className="mt-8 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
      </div>

      {/* Social Login Options */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => showNotification('info', 'Social login coming soon!')}
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="w-4 h-4 mr-2"
          />
          Continue with Google
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => showNotification('info', 'Social login coming soon!')}
        >
          <div className="w-4 h-4 mr-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
            f
          </div>
          Continue with Facebook
        </Button>
      </div>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up for free
          </Link>
        </p>
      </div>

      {/* Terms & Privacy */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;