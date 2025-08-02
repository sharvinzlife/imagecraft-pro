import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "backdrop-blur-md bg-white/20 border border-white/30",
        glass: "backdrop-blur-md bg-white/10 border border-orange-500/20 shadow-lg",
        glassSubtle: "backdrop-blur-sm bg-white/5 border border-orange-500/15",
        processing: "backdrop-blur-md bg-gradient-to-r from-orange-100/30 to-orange-200/30 border border-orange-400/30 shadow-inner",
      },
      size: {
        sm: "h-1",
        default: "h-2", 
        lg: "h-3",
        xl: "h-4",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-orange-500",
        glass: "bg-gradient-to-r from-orange-500 to-orange-600 shadow-md",
        glassSubtle: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
        processing: "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600",
        success: "bg-gradient-to-r from-green-400 to-green-600",
        warning: "bg-gradient-to-r from-yellow-400 to-yellow-600", 
        error: "bg-gradient-to-r from-red-400 to-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Progress = React.forwardRef(({ 
  className, 
  value = 0, 
  max = 100, 
  variant = "default",
  size = "default",
  showValue = false,
  showStripes = false,
  animated = false,
  ...props 
}, ref) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Smooth animation for progress value changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(progressVariants({ variant, size }), className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progress: ${Math.round(percentage)}%`}
        {...props}
      >
        <div
          className={cn(
            indicatorVariants({ variant }),
            showStripes && "bg-stripes bg-stripes-white/20",
            animated && "animate-pulse"
          )}
          style={{ 
            transform: `translateX(-${100 - displayValue}%)`,
            ...(showStripes && {
              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)',
              backgroundSize: '1rem 1rem',
              animation: animated ? 'progress-stripes 1s linear infinite' : 'none'
            })
          }}
        >
          {/* Glass shine effect for enhanced visual appeal */}
          {variant.includes('glass') && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                 style={{ animationDuration: '2s' }} />
          )}
        </div>
      </div>
      
      {/* Optional value display */}
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-900 drop-shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}>
            {Math.round(displayValue)}%
          </span>
        </div>
      )}
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };