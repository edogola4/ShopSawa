// frontend/src/pages/PasswordResetFlow.js 

// frontend/src/pages/PasswordResetFlow.js - COMPLETE PASSWORD RESET FLOW

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Shield, 
  Clock,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { authService } from '../services/auth.service';

// =============================================================================
// FORGOT PASSWORD PAGE
// =============================================================================

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useApp();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Validate email
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      setLoading(true);
      
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setEmailSent(true);
        setResendCooldown(60); // 60 seconds cooldown
        
        addNotification({
          type: 'success',
          title: 'Email Sent',
          message: 'Password reset instructions have been sent to your email'
        });
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.status === 404) {
        setErrors({ email: 'No account found with this email address' });
      } else if (error.status === 429) {
        setErrors({ email: 'Too many requests. Please try again later.' });
      } else {
        setErrors({ email: error.message || 'Failed to send reset email' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    try {
      setLoading(true);
      
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setResendCooldown(60);
        addNotification({
          type: 'success',
          title: 'Email Resent',
          message: 'Password reset instructions have been resent'
        });
      } else {
        throw new Error(response.message || 'Failed to resend email');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Resend Failed',
        message: error.message || 'Failed to resend email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {emailSent 
              ? "We've sent password reset instructions to your email"
              : "No worries! Enter your email address and we'll send you reset instructions"
            }
          </p>
        </div>

        {!emailSent ? (
          /* Email Form */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              {errors.email && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          /* Email Sent Success State */
          <div className="mt-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We've sent password reset instructions to:
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {email}
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Check your email</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Click the reset link in the email</li>
                      <li>Check your spam folder if you don't see it</li>
                      <li>The link expires in 1 hour</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the email?
              </p>
              
              <Button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || loading}
                variant="outline"
                className="w-full"
                icon={resendCooldown > 0 ? Clock : RefreshCw}
              >
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : loading 
                    ? 'Resending...' 
                    : 'Resend Email'
                }
              </Button>

              <div className="flex items-center justify-center space-x-4 text-sm">
                <Link
                  to="/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                >
                  Back to login
                </Link>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <Link
                  to="/register"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// RESET PASSWORD PAGE
// =============================================================================

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useApp();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  const token = searchParams.get('token');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
      return;
    }

    if (!token) {
      navigate('/forgot-password');
      return;
    }

    validateToken();
  }, [isAuthenticated, token, navigate]);

  // Validate password strength
  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password]);

  const validateToken = async () => {
    try {
      setTokenValidating(true);
      
      const response = await authService.validateResetToken(token);
      
      if (response.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        addNotification({
          type: 'error',
          title: 'Invalid Token',
          message: 'This password reset link is invalid or has expired'
        });
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      addNotification({
        type: 'error',
        title: 'Invalid Token',
        message: 'This password reset link is invalid or has expired'
      });
    } finally {
      setTokenValidating(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[^a-zA-Z\d]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    return { score, feedback };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const response = await authService.resetPassword({
        token,
        password: formData.password
      });
      
      if (response.success) {
        setPasswordReset(true);
        
        addNotification({
          type: 'success',
          title: 'Password Reset',
          message: 'Your password has been successfully reset'
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful. Please log in with your new password.' }
          });
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.status === 400) {
        setErrors({ password: 'Invalid or expired reset token' });
      } else {
        addNotification({
          type: 'error',
          title: 'Reset Failed',
          message: error.message || 'Failed to reset password'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({ 
      ...showPassword, 
      [field]: !showPassword[field] 
    });
  };

  const getStrengthColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  if (tokenValidating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Validating reset token...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
            <Link
              to="/login"
              className="block text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your password has been successfully reset.
            </p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Continue to Login
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {/* Reset Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword.password ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`appearance-none relative block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword.password ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-1">Password should include:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {errors.password && (
              <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword.confirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`appearance-none relative block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${
                  errors.confirmPassword 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword.confirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              loading={loading}
              disabled={loading || passwordStrength.score < 3}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Security Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use a unique password you haven't used before</li>
                <li>Consider using a password manager</li>
                <li>Don't share your password with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export both components
export default {
  ForgotPasswordPage,
  ResetPasswordPage
};