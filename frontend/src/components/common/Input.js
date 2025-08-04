// frontend/src/components/common/Input.js - FIXED VERSION

/**
 * =============================================================================
 * INPUT COMPONENT
 * =============================================================================
 * Reusable input component with validation, icons, and various input types
 */

import React, { useState, forwardRef, useId } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react';

  const Input = forwardRef(({
  label,
  error,
  helperText,
  placeholder,
  type = 'text',
  size = 'md',
  variant = 'default',
  fullWidth = true,
  disabled = false,
  required = false,
  startIcon = null,
  endIcon = null,
  clearable = false,
  showPasswordToggle = false,
  value,
  onChange,
  onClear,
  className = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperClassName = '',
  // Legacy prop support
  icon = null,
  rightIcon = null, // Add rightIcon prop
  ...props
}, ref) => {
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();

  // Handle legacy icon props
  const actualStartIcon = startIcon || icon;
  const actualEndIcon = endIcon || rightIcon;

  // Determine actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Base input classes
  const baseInputClasses = [
    'block',
    'border',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:bg-gray-50',
    'dark:disabled:bg-gray-800'
  ].join(' ');

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-4 py-3 text-base min-h-[44px]'
  };

  // Visual variants
  const variants = {
    default: [
      'border-gray-300',
      'bg-white',
      'text-gray-900',
      'placeholder-gray-400',
      'focus:border-blue-500',
      'focus:ring-blue-500',
      'dark:border-gray-600',
      'dark:bg-gray-800',
      'dark:text-gray-100',
      'dark:placeholder-gray-500',
      'dark:focus:border-blue-400',
      'dark:focus:ring-blue-400'
    ].join(' '),
    
    filled: [
      'border-transparent',
      'bg-gray-100',
      'text-gray-900',
      'placeholder-gray-500',
      'focus:bg-white',
      'focus:border-blue-500',
      'focus:ring-blue-500',
      'dark:bg-gray-700',
      'dark:text-gray-100',
      'dark:placeholder-gray-400',
      'dark:focus:bg-gray-800'
    ].join(' '),
    
    ghost: [
      'border-transparent',
      'bg-transparent',
      'text-gray-900',
      'placeholder-gray-400',
      'focus:border-gray-300',
      'focus:ring-gray-300',
      'dark:text-gray-100',
      'dark:placeholder-gray-500'
    ].join(' ')
  };

  // Error state styles
  const errorClasses = error ? [
    'border-red-500',
    'focus:border-red-500',
    'focus:ring-red-500',
    'dark:border-red-400',
    'dark:focus:border-red-400',
    'dark:focus:ring-red-400'
  ].join(' ') : '';

  // Success state styles (when no error and value exists)
  const successClasses = !error && value && value.length > 0 ? [
    'border-green-500',
    'focus:border-green-500',
    'focus:ring-green-500',
    'dark:border-green-400'
  ].join(' ') : '';

  // Icon size based on input size
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5'
  };

  // Build final input classes
  const inputClasses = [
    baseInputClasses,
    sizeClasses[size] || sizeClasses.md,
    variants[variant] || variants.default,
    errorClasses,
    successClasses,
    fullWidth ? 'w-full' : '',
    actualStartIcon ? 'pl-10' : '',
    (actualEndIcon || clearable || (type === 'password' && showPasswordToggle)) ? 'pr-10' : '',
    inputClassName
  ].filter(Boolean).join(' ');

  // Handle input change
  const handleChange = (event) => {
    if (onChange) {
      onChange(event);
    }
  };

  // Handle clear action
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      // Create synthetic event for clearing
      const syntheticEvent = {
        target: { value: '', name: props.name }
      };
      onChange(syntheticEvent);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Render start icon
  const StartIcon = () => {
    if (!actualStartIcon) return null;
    
    const IconComponent = actualStartIcon;
    return (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <IconComponent 
          className={`${iconSizes[size]} text-gray-400`}
          aria-hidden="true"
        />
      </div>
    );
  };

  // Render end icon(s) - FIXED VERSION
  const EndIcon = () => {
    const hasEndIcon = actualEndIcon;
    const hasClearButton = clearable && value && value.length > 0;
    const hasPasswordToggle = type === 'password' && showPasswordToggle;
    const hasSuccessIcon = !error && value && value.length > 0 && !hasEndIcon && !hasClearButton && !hasPasswordToggle;
    const hasErrorIcon = error && !hasEndIcon && !hasClearButton && !hasPasswordToggle;

    if (!hasEndIcon && !hasClearButton && !hasPasswordToggle && !hasSuccessIcon && !hasErrorIcon) {
      return null;
    }

    return (
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {/* Custom end icon - FIXED */}
        {hasEndIcon && (
          <div className="flex items-center">
            {React.isValidElement(actualEndIcon) ? (
              // If endIcon is already a JSX element, render it directly
              actualEndIcon
            ) : typeof actualEndIcon === 'function' ? (
              // If endIcon is a component function, render it as a component
              React.createElement(actualEndIcon, { 
                className: `${iconSizes[size]} text-gray-400`,
                'aria-hidden': true
              })
            ) : (
              // Fallback for other cases
              actualEndIcon
            )}
          </div>
        )}
        
        {/* Success icon */}
        {hasSuccessIcon && (
          <CheckCircle 
            className={`${iconSizes[size]} text-green-500`}
            aria-hidden="true"
          />
        )}
        
        {/* Error icon */}
        {hasErrorIcon && (
          <AlertCircle 
            className={`${iconSizes[size]} text-red-500`}
            aria-hidden="true"
          />
        )}
        
        {/* Clear button */}
        {hasClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            aria-label="Clear input"
          >
            <X className={iconSizes[size]} />
          </button>
        )}
        
        {/* Password toggle */}
        {hasPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className={iconSizes[size]} />
            ) : (
              <Eye className={iconSizes[size]} />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300 ${
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''
          } ${labelClassName}`}
        >
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <StartIcon />
        
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            [
              error ? errorId : null,
              helperText ? helperId : null
            ].filter(Boolean).join(' ') || undefined
          }
          {...(function() {
            // Filter out custom props that shouldn't be passed to DOM
            const { 
              label, 
              error, 
              helperText, 
              size, 
              variant, 
              fullWidth, 
              startIcon, 
              endIcon, 
              clearable, 
              showPasswordToggle, 
              onClear, 
              labelClassName, 
              inputClassName, 
              errorClassName, 
              helperClassName, 
              icon, 
              rightIcon,
              ...domProps 
            } = props;
            return domProps;
          })()}
        />
        
        <EndIcon />
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p 
          id={helperId}
          className={`mt-2 text-sm text-gray-500 dark:text-gray-400 ${helperClassName}`}
        >
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p 
          id={errorId}
          className={`mt-2 text-sm text-red-600 dark:text-red-400 flex items-center ${errorClassName}`}
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component
export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  placeholder,
  rows = 4,
  resize = true,
  maxLength,
  showCharCount = false,
  fullWidth = true,
  disabled = false,
  required = false,
  value,
  onChange,
  className = '',
  labelClassName = '',
  textareaClassName = '',
  ...props
}, ref) => {
  
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();
  
  const charCount = value ? value.length : 0;
  const isOverLimit = maxLength && charCount > maxLength;

  // Base textarea classes
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'border-gray-300',
    'rounded-lg',
    'px-4',
    'py-2.5',
    'text-sm',
    'bg-white',
    'text-gray-900',
    'placeholder-gray-400',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:border-blue-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:bg-gray-50',
    'dark:border-gray-600',
    'dark:bg-gray-800',
    'dark:text-gray-100',
    'dark:placeholder-gray-500',
    'dark:focus:border-blue-400',
    'dark:focus:ring-blue-400',
    'dark:disabled:bg-gray-800'
  ].join(' ');

  // Error state classes
  const errorClasses = error ? [
    'border-red-500',
    'focus:border-red-500',
    'focus:ring-red-500',
    'dark:border-red-400'
  ].join(' ') : '';

  // Resize classes
  const resizeClasses = {
    true: 'resize',
    false: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x'
  };

  const textareaClasses = [
    baseClasses,
    errorClasses,
    resizeClasses[resize] || resizeClasses.true,
    textareaClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300 ${
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''
          } ${labelClassName}`}
        >
          {label}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          [
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined
        }
        {...props}
      />

      {/* Character count */}
      {showCharCount && maxLength && (
        <div className="mt-1 flex justify-end">
          <span className={`text-sm ${
            isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {charCount}/{maxLength}
          </span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p 
          id={helperId}
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p 
          id={errorId}
          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select component
export const Select = forwardRef(({
  label,
  error,
  helperText,
  placeholder = 'Select an option...',
  options = [],
  size = 'md',
  fullWidth = true,
  disabled = false,
  required = false,
  value,
  onChange,
  className = '',
  labelClassName = '',
  selectClassName = '',
  ...props
}, ref) => {
  
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();

  // Base select classes
  const baseClasses = [
    'block',
    'border',
    'border-gray-300',
    'rounded-lg',
    'bg-white',
    'text-gray-900',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:border-blue-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:bg-gray-50',
    'dark:border-gray-600',
    'dark:bg-gray-800',
    'dark:text-gray-100',
    'dark:focus:border-blue-400',
    'dark:focus:ring-blue-400',
    'dark:disabled:bg-gray-800'
  ].join(' ');

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-4 py-3 text-base min-h-[44px]'
  };

  // Error state classes
  const errorClasses = error ? [
    'border-red-500',
    'focus:border-red-500',
    'focus:ring-red-500'
  ].join(' ') : '';

  const selectClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.md,
    errorClasses,
    fullWidth ? 'w-full' : '',
    selectClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300 ${
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''
          } ${labelClassName}`}
        >
          {label}
        </label>
      )}

      {/* Select */}
      <select
        ref={ref}
        id={inputId}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          [
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined
        }
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Helper text */}
      {helperText && !error && (
        <p 
          id={helperId}
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p 
          id={errorId}
          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;