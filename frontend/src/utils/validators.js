// frontend/src/utils/validators.js

/**
 * =============================================================================
 * FORM VALIDATION UTILITIES
 * =============================================================================
 * Comprehensive validation functions for forms with detailed error messages
 * and security considerations. All validation logic centralized here to
 * maintain DRY principle and ensure consistent validation across the app.
 */

import { 
    VALIDATION_PATTERNS, 
    BUSINESS_RULES, 
    ERROR_MESSAGES 
  } from './constants';
  
  // =============================================================================
  // BASIC FIELD VALIDATORS
  // =============================================================================
  
  /**
   * Validate required field
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} Error message or null if valid
   */
  export const validateRequired = (value, fieldName = 'This field') => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required`;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return `${fieldName} is required`;
    }
    
    return null;
  };
  
  /**
   * Validate string length
   * @param {string} value - Value to validate
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} Error message or null if valid
   */
  export const validateLength = (value, min = 0, max = Infinity, fieldName = 'This field') => {
    if (typeof value !== 'string') return null;
    
    const length = value.trim().length;
    
    if (length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    
    if (length > max) {
      return `${fieldName} must be no more than ${max} characters long`;
    }
    
    return null;
  };
  
  /**
   * Validate numeric value
   * @param {any} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} Error message or null if valid
   */
  export const validateNumeric = (value, min = -Infinity, max = Infinity, fieldName = 'This field') => {
    const num = Number(value);
    
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    
    if (num > max) {
      return `${fieldName} must be no more than ${max}`;
    }
    
    return null;
  };
  
  /**
   * Validate pattern match
   * @param {string} value - Value to validate
   * @param {RegExp} pattern - Pattern to match
   * @param {string} message - Custom error message
   * @returns {string|null} Error message or null if valid
   */
  export const validatePattern = (value, pattern, message) => {
    if (typeof value !== 'string') return null;
    
    if (!pattern.test(value)) {
      return message;
    }
    
    return null;
  };
  
  // =============================================================================
  // SPECIFIC FIELD VALIDATORS
  // =============================================================================
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {string|null} Error message or null if valid
   */
  export const validateEmail = (email) => {
    // Check if required
    const requiredError = validateRequired(email, 'Email');
    if (requiredError) return requiredError;
    
    // Check length
    const lengthError = validateLength(email, 5, 254, 'Email');
    if (lengthError) return lengthError;
    
    // Check pattern
    const patternError = validatePattern(
      email.trim().toLowerCase(),
      VALIDATION_PATTERNS.EMAIL,
      ERROR_MESSAGES.INVALID_EMAIL
    );
    if (patternError) return patternError;
    
    // Additional security checks
    const trimmed = email.trim();
    
    // Check for suspicious patterns
    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    
    // Check domain part
    const [localPart, domainPart] = trimmed.split('@');
    if (!localPart || !domainPart) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    
    if (localPart.length > 64 || domainPart.length > 253) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    
    return null;
  };
  
  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {object} Validation result with errors array
   */
  export const validatePassword = (password) => {
    const errors = [];
    
    // Check if required
    const requiredError = validateRequired(password, 'Password');
    if (requiredError) {
      return { isValid: false, errors: [requiredError] };
    }
    
    // Check length
    if (password.length < BUSINESS_RULES.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${BUSINESS_RULES.MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (password.length > BUSINESS_RULES.MAX_PASSWORD_LENGTH) {
      errors.push(`Password must be no more than ${BUSINESS_RULES.MAX_PASSWORD_LENGTH} characters long`);
    }
    
    // Check complexity requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check for common weak patterns
    const commonPatterns = [
      /^(.)\1+$/, // Same character repeated
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde)/, // Sequential characters
      /^(password|123456|qwerty|admin)/i, // Common passwords
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password is too common or predictable');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate password confirmation
   * @param {string} password - Original password
   * @param {string} confirmPassword - Confirmation password
   * @returns {string|null} Error message or null if valid
   */
  export const validatePasswordConfirmation = (password, confirmPassword) => {
    const requiredError = validateRequired(confirmPassword, 'Password confirmation');
    if (requiredError) return requiredError;
    
    if (password !== confirmPassword) {
      return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
    }
    
    return null;
  };
  
  /**
   * Validate Kenyan phone number
   * @param {string} phone - Phone number to validate
   * @returns {string|null} Error message or null if valid
   */
  export const validatePhone = (phone) => {
    const requiredError = validateRequired(phone, 'Phone number');
    if (requiredError) return requiredError;
    
    // Clean the phone number
    const cleaned = phone.replace(/\s/g, '');
    
    // Check pattern
    const patternError = validatePattern(
      cleaned,
      VALIDATION_PATTERNS.PHONE_KE,
      ERROR_MESSAGES.INVALID_PHONE
    );
    
    return patternError;
  };
  
  /**
   * Validate name field
   * @param {string} name - Name to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} Error message or null if valid
   */
  export const validateName = (name, fieldName = 'Name') => {
    const requiredError = validateRequired(name, fieldName);
    if (requiredError) return requiredError;
    
    const lengthError = validateLength(name, 2, 50, fieldName);
    if (lengthError) return lengthError;
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const patternError = validatePattern(
      name.trim(),
      /^[a-zA-Z\s\-']+$/,
      `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    );
    
    return patternError;
  };
  
  /**
   * Validate address
   * @param {string} address - Address to validate
   * @returns {string|null} Error message or null if valid
   */
  export const validateAddress = (address) => {
    const requiredError = validateRequired(address, 'Address');
    if (requiredError) return requiredError;
    
    const lengthError = validateLength(address, 5, 200, 'Address');
    if (lengthError) return lengthError;
    
    return null;
  };
  
  /**
   * Validate city name
   * @param {string} city - City to validate
   * @returns {string|null} Error message or null if valid
   */
  export const validateCity = (city) => {
    const requiredError = validateRequired(city, 'City');
    if (requiredError) return requiredError;
    
    const lengthError = validateLength(city, 2, 50, 'City');
    if (lengthError) return lengthError;
    
    const patternError = validatePattern(
      city.trim(),
      /^[a-zA-Z\s\-']+$/,
      'City name can only contain letters, spaces, hyphens, and apostrophes'
    );
    
    return patternError;
  };
  
  /**
   * Validate product quantity
   * @param {number} quantity - Quantity to validate
   * @param {number} maxAvailable - Maximum available quantity
   * @returns {string|null} Error message or null if valid
   */
  export const validateQuantity = (quantity, maxAvailable = Infinity) => {
    const numericError = validateNumeric(quantity, 1, BUSINESS_RULES.MAX_QUANTITY_PER_ITEM, 'Quantity');
    if (numericError) return numericError;
    
    if (quantity > maxAvailable) {
      return `Only ${maxAvailable} items available`;
    }
    
    return null;
  };
  
  /**
   * Validate product review
   * @param {object} review - Review object { rating, comment }
   * @returns {object} Validation result with field errors
   */
  export const validateReview = (review) => {
    const errors = {};
    
    // Validate rating
    if (!review.rating) {
      errors.rating = 'Rating is required';
    } else {
      const ratingError = validateNumeric(
        review.rating,
        BUSINESS_RULES.MIN_RATING,
        BUSINESS_RULES.MAX_RATING,
        'Rating'
      );
      if (ratingError) errors.rating = ratingError;
    }
    
    // Validate comment
    if (review.comment) {
      const commentError = validateLength(
        review.comment,
        10,
        BUSINESS_RULES.MAX_REVIEW_LENGTH,
        'Comment'
      );
      if (commentError) errors.comment = commentError;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  export const validateFile = (file) => {
    const errors = [];
    
    if (!file) {
      return { isValid: false, errors: ['No file selected'] };
    }
    
    // Check file size
    if (file.size > BUSINESS_RULES.MAX_IMAGE_SIZE) {
      errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
    
    // Check file type
    if (!BUSINESS_RULES.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long');
    }
    
    // Security check: validate file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const expectedExtensions = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif']
    };
    
    const validExtensions = expectedExtensions[file.type];
    if (validExtensions && !validExtensions.includes(extension)) {
      errors.push('File extension does not match file type');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // =============================================================================
  // FORM VALIDATORS
  // =============================================================================
  
  /**
   * Validate login form
   * @param {object} formData - Form data { email, password }
   * @returns {object} Validation result with field errors
   */
  export const validateLoginForm = (formData) => {
    const errors = {};
    
    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    // Validate password (just required for login)
    const passwordRequiredError = validateRequired(formData.password, 'Password');
    if (passwordRequiredError) errors.password = passwordRequiredError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate registration form
   * @param {object} formData - Form data
   * @returns {object} Validation result with field errors
   */
  export const validateRegistrationForm = (formData) => {
    const errors = {};
    
    // Validate first name
    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    // Validate last name
    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    
    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    // Validate phone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    
    // Validate password
    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors[0]; // Show first error
    }
    
    // Validate password confirmation
    const confirmPasswordError = validatePasswordConfirmation(
      formData.password,
      formData.confirmPassword
    );
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate profile form
   * @param {object} formData - Form data
   * @returns {object} Validation result with field errors
   */
  export const validateProfileForm = (formData) => {
    const errors = {};
    
    // Validate first name
    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    // Validate last name
    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    
    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    // Validate phone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate address form
   * @param {object} formData - Address form data
   * @returns {object} Validation result with field errors
   */
  export const validateAddressForm = (formData) => {
    const errors = {};
    
    // Validate name
    const nameError = validateName(formData.name, 'Full name');
    if (nameError) errors.name = nameError;
    
    // Validate phone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    
    // Validate address
    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;
    
    // Validate city
    const cityError = validateCity(formData.city);
    if (cityError) errors.city = cityError;
    
    // Validate county
    const countyError = validateRequired(formData.county, 'County');
    if (countyError) errors.county = countyError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate checkout form
   * @param {object} formData - Checkout form data
   * @returns {object} Validation result with field errors
   */
  export const validateCheckoutForm = (formData) => {
    const errors = {};
    
    // Validate shipping address
    const shippingAddressResult = validateAddressForm(formData.shippingAddress || {});
    if (!shippingAddressResult.isValid) {
      errors.shippingAddress = shippingAddressResult.errors;
    }
    
    // Validate billing address if different from shipping
    if (!formData.sameAsBilling && formData.billingAddress) {
      const billingAddressResult = validateAddressForm(formData.billingAddress);
      if (!billingAddressResult.isValid) {
        errors.billingAddress = billingAddressResult.errors;
      }
    }
    
    // Validate payment method
    const paymentMethodError = validateRequired(formData.paymentMethod, 'Payment method');
    if (paymentMethodError) errors.paymentMethod = paymentMethodError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate search query
   * @param {string} query - Search query
   * @returns {string|null} Error message or null if valid
   */
  export const validateSearchQuery = (query) => {
    if (!query || typeof query !== 'string') return null;
    
    const trimmed = query.trim();
    
    if (trimmed.length < 2) {
      return 'Search query must be at least 2 characters long';
    }
    
    if (trimmed.length > 100) {
      return 'Search query must be no more than 100 characters long';
    }
    
    // Check for suspicious patterns (potential XSS attempts)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmed)) {
        return 'Search query contains invalid characters';
      }
    }
    
    return null;
  };
  
  // =============================================================================
  // UTILITY VALIDATORS
  // =============================================================================
  
  /**
   * Validate form field dynamically
   * @param {string} fieldType - Type of field to validate
   * @param {any} value - Value to validate
   * @param {object} options - Validation options
   * @returns {string|null} Error message or null if valid
   */
  export const validateField = (fieldType, value, options = {}) => {
    switch (fieldType) {
      case 'email':
        return validateEmail(value);
      
      case 'password':
        const result = validatePassword(value);
        return result.isValid ? null : result.errors[0];
      
      case 'phone':
        return validatePhone(value);
      
      case 'name':
        return validateName(value, options.fieldName);
      
      case 'required':
        return validateRequired(value, options.fieldName);
      
      case 'numeric':
        return validateNumeric(value, options.min, options.max, options.fieldName);
      
      case 'length':
        return validateLength(value, options.min, options.max, options.fieldName);
      
      default:
        return null;
    }
  };
  
  /**
   * Validate multiple fields at once
   * @param {object} formData - Form data object
   * @param {object} validationRules - Validation rules object
   * @returns {object} Validation result with field errors
   */
  export const validateMultipleFields = (formData, validationRules) => {
    const errors = {};
    
    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const value = formData[fieldName];
      
      for (const rule of rules) {
        const error = validateField(rule.type, value, { 
          fieldName: rule.fieldName || fieldName,
          ...rule.options 
        });
        
        if (error) {
          errors[fieldName] = error;
          break; // Stop at first error for this field
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Export all validators
  export default {
    validateRequired,
    validateLength,
    validateNumeric,
    validatePattern,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validatePhone,
    validateName,
    validateAddress,
    validateCity,
    validateQuantity,
    validateReview,
    validateFile,
    validateLoginForm,
    validateRegistrationForm,
    validateProfileForm,
    validateAddressForm,
    validateCheckoutForm,
    validateSearchQuery,
    validateField,
    validateMultipleFields,
  };