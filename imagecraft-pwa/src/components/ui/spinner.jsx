import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const Spinner = React.forwardRef(({ 
  className, 
  size = 'default', 
  variant = 'default',
  ...props 
}, ref) => {
  const sizes = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variants = {
    default: 'text-orange-500',
    light: 'text-white',
    dark: 'text-gray-800',
    muted: 'text-gray-500',
  };

  return (
    <Loader2
      ref={ref}
      className={cn(
        'animate-spin',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Spinner.displayName = 'Spinner';

// Loading component with optional text
const Loading = ({ 
  text, 
  size = 'default', 
  variant = 'default',
  className,
  textClassName,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center space-y-3',
        className
      )}
      {...props}
    >
      <Spinner size={size} variant={variant} />
      {text && (
        <p 
          className={cn(
            'text-sm font-medium',
            variant === 'light' ? 'text-white' : 'text-gray-600',
            textClassName
          )}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Inline spinner for buttons and small spaces
const InlineSpinner = ({ 
  size = 'small', 
  variant = 'default',
  className,
  ...props 
}) => {
  return (
    <Spinner
      size={size}
      variant={variant}
      className={cn('inline-block', className)}
      {...props}
    />
  );
};

export { Spinner, Loading, InlineSpinner };