import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const cardVariants = cva(
  "rounded-2xl transition-all duration-300 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "border bg-card text-card-foreground shadow-sm",
        glass: "card-glass-accessible",
        glassSubtle: "card-glass-subtle-accessible",
        glassCream: "card-glass-cream-accessible",
        glassPeach: "card-glass-peach-accessible",
        glassPrimary: "card-glass-cream-accessible",
        glassSecondary: "card-glass-accessible",
        glassAccessible: "card-glass-accessible",
        glassFloating: "card-glass-peach-accessible hover:scale-[1.02] hover:-translate-y-2 transition-all duration-300",
        glassEnhanced: "card-glass-cream-accessible transform-gpu transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Card = React.forwardRef(({ className, variant, children, floatingElements, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {/* Enhanced Glass morphism inner light effect */}
      {variant?.includes('glass') && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-white/8 rounded-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-b-2xl pointer-events-none" />
        </>
      )}
      
      {/* Enhanced floating background elements for depth */}
      {floatingElements && (
        <>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-300/25 to-orange-400/20 rounded-full blur-sm animate-gentle-breathe" />
          <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-gradient-to-br from-orange-200/20 to-orange-300/15 rounded-full blur-md animate-gentle-float-reverse" />
          <div className="absolute top-1/2 -right-2 w-3 h-3 bg-gradient-to-br from-white/30 to-orange-100/25 rounded-full blur-sm animate-gentle-float" style={{ animationDelay: '2s', animationDuration: '20s' }} />
        </>
      )}
      
      {/* Content with proper z-index */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight",
      className
    )}
    style={{ 
      fontFamily: 'Poppins, sans-serif',
      textShadow: '0 1px 3px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(255, 255, 255, 0.3)'
    }}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-medium", className)}
    style={{ 
      fontFamily: 'Inter, sans-serif',
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)'
    }}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }