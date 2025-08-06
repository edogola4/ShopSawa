// frontend/src/components/auth/LoginForm.js

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { validateEmail, validatePassword } from '../../utils/validators';
import { motion } from 'framer-motion';

const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/';
  
  // Check for password reset success message
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      showNotification('success', 'Your password has been reset successfully! Please log in with your new password.');
      // Clear the reset param from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reset');
      window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams}`);
    }
  }, [searchParams, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trimStart()
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
    if (!formData.email.trim()) {
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
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);
      
      await login(formData.email, formData.password, rememberMe);
      
      showNotification('success', 'Welcome back! Login successful');
      setLoginAttempts(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Show password reset prompt after 2 failed attempts
        if (attempts >= 2 && error.response.data.code === 'INVALID_CREDENTIALS') {
          setShowResetPrompt(true);
        }
      }
      
      showNotification('error', errorMessage);
      
      // Set specific field errors if provided by backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isSubmitting) return;
    
    setFormData({
      email: 'demo@shopsawa.com',
      password: 'demo123'
    });
    
    // Clear any existing errors
    setErrors({});
    
    // Auto-submit after a brief delay to show the form populated
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 300);
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Sign in to your ShopSawa account
        </p>
      </div>

      {/* Demo Login Banner */}
      <motion.div 
        className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Try Demo Account</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">Quick login for testing</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50"
          >
            {loading && loginAttempts > 0 ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Demo Login'
            )}
          </Button>
        </div>
      </motion.div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
            disabled={loading}
          />
        </div>

        {/* Password Field */}
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
            disabled={loading}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
          
          {/* Password Reset Prompt */}
          {showResetPrompt && (
            <motion.div 
              className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300 flex items-start"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Having trouble signing in?</p>
                <p>
                  <Link 
                    to={`/forgot-password?email=${encodeURIComponent(formData.email)}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset your password
                  </Link> or try again.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
          </label>
          
          <Link
            to={`/forgot-password${formData.email ? `?email=${encodeURIComponent(formData.email)}` : ''}`}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center"
            disabled={loading || isSubmitting}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginForm;