import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Screen reader only utility - using Tailwind's sr-only class instead

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden transform-gpu text-balance hyphens-auto break-words",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "btn-glass-secondary-accessible min-h-[44px] min-w-[44px]",
        glassSecondary: "btn-glass-secondary-accessible min-h-[44px] min-w-[44px]",
        glassPrimary: "btn-glass-accessible min-h-[44px] min-w-[44px]",
        glassOrange: "btn-glass-orange-accessible min-h-[44px] min-w-[44px]",
        glassFloating: "btn-glass-floating-accessible min-h-[56px] min-w-[56px]",
        glassEnhanced: "btn-glass-orange-accessible min-h-[44px] min-w-[44px] hover:scale-105 hover:-translate-y-1 transition-all duration-300",
      },
      size: {
        default: "h-11 px-4 sm:px-6 py-2 text-xs sm:text-sm min-w-[44px] leading-tight",
        sm: "h-9 rounded-lg px-3 sm:px-4 text-xs sm:text-sm min-w-[36px] leading-tight",
        lg: "h-12 rounded-xl px-6 sm:px-8 text-sm sm:text-base min-w-[48px] leading-tight",
        xl: "h-14 rounded-2xl px-8 sm:px-10 text-base sm:text-lg min-w-[56px] leading-tight",
        icon: "h-11 w-11 min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    children, 
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    disabled,
    type = 'button',
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isGlassVariant = variant?.includes('glass') || variant?.includes('Glass')
    
    // Generate accessible attributes for glass variants
    const accessibleProps = React.useMemo(() => {
      const baseProps = {
        type: asChild ? undefined : type,
        'aria-disabled': disabled,
        ...props
      };
      
      if (isGlassVariant) {
        // Add glass-specific accessibility attributes
        baseProps['aria-describedby'] = ariaDescribedBy || 'glass-button-help';
        baseProps['data-glass-button'] = true;
        
        // If no aria-label is provided, generate one based on variant
        if (!ariaLabel && !baseProps['aria-label']) {
          const variantLabels = {
            glass: 'Glass morphism button',
            glassSecondary: 'Secondary glass button',
            glassPrimary: 'Primary glass button',  
            glassFloating: 'Floating glass button'
          };
          baseProps['aria-label'] = variantLabels[variant] || 'Glass button';
        }
      }
      
      if (ariaLabel) {
        baseProps['aria-label'] = ariaLabel;
      }
      
      return baseProps;
    }, [isGlassVariant, variant, ariaLabel, ariaDescribedBy, disabled, type, asChild, props]);
    
    return (
      <>
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          style={{ fontFamily: 'Inter, sans-serif' }}
          ref={ref}
          {...accessibleProps}
        >
        {/* Glass morphism inner light effect */}
        {isGlassVariant && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-xl pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </>
        )}
        
        {/* Content with proper text shadow for glass variants */}
        <span 
          className={`relative z-10 flex items-center justify-center gap-1 sm:gap-2 text-center w-full ${isGlassVariant ? 'drop-shadow-sm' : ''}`}
          style={{
            ...isGlassVariant ? { textShadow: '0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(255, 255, 255, 0.3)' } : {},
            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
            lineHeight: '1.2',
            wordWrap: 'break-word',
            overflowWrap: 'anywhere'
          }}
          aria-hidden="true"
        >
          {children}
        </span>
      </Comp>
      
      {/* Hidden accessibility helper text for glass buttons */}
      {isGlassVariant && (
        <div 
          id="glass-button-help" 
          className="sr-only" 
          aria-hidden="true"
        >
          Glass morphism interactive element with enhanced visual effects
        </div>
      )}
    </>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }