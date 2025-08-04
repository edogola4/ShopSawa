// frontend/src/components/common/Button.js

/**
 * =============================================================================
 * BUTTON COMPONENT
 * =============================================================================
 * Reusable button component with multiple variants, sizes, and states
 */

import React, { forwardRef } from 'react';
import { Loader } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  loadingText = 'Loading...',
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  
  // Base button classes
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none'
  ].join(' ');

  // Variant styles
  const variants = {
    primary: [
      'bg-blue-600',
      'text-white',
      'hover:bg-blue-700',
      'focus:ring-blue-500',
      'active:bg-blue-800'
    ].join(' '),
    
    secondary: [
      'bg-gray-200',
      'text-gray-900',
      'hover:bg-gray-300',
      'focus:ring-gray-500',
      'active:bg-gray-400',
      'dark:bg-gray-700',
      'dark:text-gray-100',
      'dark:hover:bg-gray-600'
    ].join(' '),
    
    outline: [
      'border',
      'border-gray-300',
      'bg-white',
      'text-gray-700',
      'hover:bg-gray-50',
      'focus:ring-gray-500',
      'active:bg-gray-100',
      'dark:border-gray-600',
      'dark:bg-gray-800',
      'dark:text-gray-300',
      'dark:hover:bg-gray-700'
    ].join(' '),
    
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'hover:bg-gray-100',
      'focus:ring-gray-500',
      'active:bg-gray-200',
      'dark:text-gray-300',
      'dark:hover:bg-gray-800'
    ].join(' '),
    
    success: [
      'bg-green-600',
      'text-white',
      'hover:bg-green-700',
      'focus:ring-green-500',
      'active:bg-green-800'
    ].join(' '),
    
    warning: [
      'bg-yellow-600',
      'text-white',
      'hover:bg-yellow-700',
      'focus:ring-yellow-500',
      'active:bg-yellow-800'
    ].join(' '),
    
    danger: [
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'focus:ring-red-500',
      'active:bg-red-800'
    ].join(' '),
    
    link: [
      'bg-transparent',
      'text-blue-600',
      'hover:text-blue-700',
      'hover:underline',
      'focus:ring-blue-500',
      'p-0',
      'h-auto',
      'dark:text-blue-400'
    ].join(' ')
  };

  // Size styles
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs min-h-[28px]',
    sm: 'px-3 py-2 text-sm min-h-[32px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  };

  // Icon sizes based on button size
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  // Build final className
  const buttonClasses = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // Handle click with loading state
  const handleClick = (event) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  };

  // Get icon size class
  const iconSizeClass = iconSizes[size] || iconSizes.md;

  // Render loading icon
  const LoadingIcon = () => (
    <Loader 
      className={`animate-spin ${iconSizeClass} ${children ? 'mr-2' : ''}`}
      aria-hidden="true"
    />
  );

  // Render start icon
  const StartIcon = () => {
    if (loading) return <LoadingIcon />;
    if (!startIcon) return null;
    
    const IconComponent = startIcon;
    return (
      <IconComponent 
        className={`${iconSizeClass} ${children ? 'mr-2' : ''}`}
        aria-hidden="true"
      />
    );
  };

  // Render end icon
  const EndIcon = () => {
    if (loading || !endIcon) return null;
    
    const IconComponent = endIcon;
    return (
      <IconComponent 
        className={`${iconSizeClass} ${children ? 'ml-2' : ''}`}
        aria-hidden="true"
      />
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      {...props}
    >
      <StartIcon />
      
      {loading && loadingText ? loadingText : children}
      
      <EndIcon />
    </button>
  );
});

Button.displayName = 'Button';

// Button group component for related buttons
export const ButtonGroup = ({ 
  children, 
  variant = 'outline',
  size = 'md',
  orientation = 'horizontal',
  spacing = 'attached',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex';
  
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  const spacingClasses = {
    attached: orientation === 'horizontal' 
      ? '[&>*:not(:first-child)]:ml-0 [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:rounded-l-none'
      : '[&>*:not(:first-child)]:mt-0 [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:rounded-t-none',
    separated: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2'
  };

  const groupClasses = [
    baseClasses,
    orientationClasses[orientation],
    spacingClasses[spacing],
    className
  ].filter(Boolean).join(' ');

  // Clone children with consistent props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Button) {
      return React.cloneElement(child, {
        variant: child.props.variant || variant,
        size: child.props.size || size
      });
    }
    return child;
  });

  return (
    <div className={groupClasses} role="group" {...props}>
      {childrenWithProps}
    </div>
  );
};

// Icon button component
export const IconButton = forwardRef(({
  icon: Icon,
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  
  if (!Icon) {
    console.error('IconButton requires an icon prop');
    return null;
  }

  if (!ariaLabel) {
    console.error('IconButton requires an aria-label for accessibility');
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const buttonSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      className={`${buttonSizes[size]} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Floating Action Button component
export const FloatingActionButton = forwardRef(({
  icon: Icon,
  position = 'bottom-right',
  size = 'lg',
  className = '',
  ...props
}, ref) => {
  
  const positionClasses = {
    'top-left': 'fixed top-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4'
  };

  const fabClasses = [
    'rounded-full',
    'shadow-lg',
    'hover:shadow-xl',
    'transition-shadow',
    'z-50',
    positionClasses[position],
    className
  ].filter(Boolean).join(' ');

  return (
    <IconButton
      ref={ref}
      icon={Icon}
      variant="primary"
      size={size}
      className={fabClasses}
      {...props}
    />
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

export default Button;