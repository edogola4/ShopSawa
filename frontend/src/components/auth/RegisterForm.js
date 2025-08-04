// frontend/src/components/auth/RegisterForm.js - COMPLETE FIXED VERSION

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validatePhone 
} from '../../utils/validators';

const RegisterForm = ({ onSuccess, redirectTo = '/' }) => {
  const { register } = useAuth();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    newsletter: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleAgreementChange = (name, checked) => {
    setAgreements(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Only show error if field has been touched
  const getError = (fieldName) => {
    return touched[fieldName] ? errors[fieldName] : '';
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (validateName(formData.firstName)) {
      newErrors.firstName = validateName(formData.firstName);
    }

    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (validateName(formData.lastName)) {
      newErrors.lastName = validateName(formData.lastName);
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (validateEmail(formData.email)) {
      newErrors.email = validateEmail(formData.email);
    }

    // Phone validation - more lenient
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Basic phone validation - just check if it has at least 8 digits
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        // Use the first error message from the validation
        newErrors.password = passwordValidation.errors[0] || 'Invalid password';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!agreements.terms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched on submit
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    allTouched.terms = true; // For terms checkbox
    setTouched(allTouched);
    
    if (!validateForm()) {
      return;
    }

    // 🔍 DEBUG: Check what data we're sending
    console.log('🔍 RegisterForm - Form data being sent:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      hasPassword: !!formData.password,
      hasConfirmPassword: !!formData.confirmPassword,
      passwordsMatch: formData.password === formData.confirmPassword
    });

    try {
      setLoading(true);
      
      // ✅ FIXED: Ensure all required fields are included
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,           // ✅ Include password
        confirmPassword: formData.confirmPassword, // ✅ Include confirmPassword  
        subscribeToNewsletter: agreements.newsletter
      };

      // 🔍 DEBUG: Check userData object
      console.log('🔍 RegisterForm - userData object:', {
        ...userData,
        password: '***masked***',
        confirmPassword: '***masked***'
      });

      await register(userData);
      
      showNotification('success', 'Account created successfully! Welcome to ShopSawa');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('❌ RegisterForm - Registration error:', error);
      
      const errorMessage = error.message || 'Registration failed. Please try again.';
      showNotification('error', errorMessage);
      
      // Set specific field errors if provided by backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    return {
      score: strength,
      checks,
      label: strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong',
      color: strength < 2 ? 'red' : strength < 4 ? 'yellow' : 'green'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">
          Join ShopSawa and start shopping today
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            name="firstName"
            label="First Name"
            placeholder="Bran"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getError('firstName')}
            icon={User}
            required
            autoComplete="given-name"
          />
          
          <Input
            type="text"
            name="lastName"
            label="Last Name"
            placeholder="Don"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getError('lastName')}
            required
            autoComplete="family-name"
          />
        </div>

        {/* Email Field */}
        <Input
          type="email"
          name="email"
          label="Email Address"
          placeholder="brandon@example.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getError('email')}
          icon={Mail}
          required
          autoComplete="email"
        />

        {/* Phone Field */}
        <Input
          type="tel"
          name="phone"
          label="Phone Number"
          placeholder="e.g. 0712345678"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getError('phone')}
          icon={Phone}
          required
          autoComplete="tel"
        />

        {/* Password Field */}
        <div>
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getError('password')}
            icon={Lock}
            required
            autoComplete="new-password"
            rightIcon={
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
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs font-medium ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    passwordStrength.color === 'red' ? 'bg-red-500' :
                    passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`
                  }}
                />
              </div>
              <div className="grid grid-cols-5 gap-1 mt-2 text-xs">
                {Object.entries(passwordStrength.checks).map(([key, met]) => (
                  <div key={key} className={`flex items-center ${met ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="w-3 h-3 mr-1" />
                    <span className="capitalize">{key === 'length' ? '8+ chars' : key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getError('confirmPassword')}
          icon={Lock}
          required
          autoComplete="new-password"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        {/* Agreements */}
        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreements.terms}
              onChange={(e) => handleAgreementChange('terms', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <span className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                Privacy Policy
              </Link>
            </span>
          </label>
          
          {getError('terms') && (
            <p className="text-sm text-red-600">{getError('terms')}</p>
          )}
          
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreements.newsletter}
              onChange={(e) => handleAgreementChange('newsletter', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <span className="ml-2 text-sm text-gray-600">
              Subscribe to our newsletter for deals and updates (optional)
            </span>
          </label>
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
          {loading ? 'Creating Account...' : 'Create Account'}
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

      {/* Social Registration Options */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => showNotification('info', 'Social registration coming soon!')}
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="w-4 h-4 mr-2"
          />
          Sign up with Google
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => showNotification('info', 'Social registration coming soon!')}
        >
          <div className="w-4 h-4 mr-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
            f
          </div>
          Sign up with Facebook
        </Button>
      </div>

      {/* Sign In Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;