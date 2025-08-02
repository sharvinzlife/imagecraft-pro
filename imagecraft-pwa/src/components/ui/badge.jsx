import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Glass morphism variants
        glass:
          "backdrop-blur-sm bg-white/20 border-orange-500/30 text-gray-900 [a&]:hover:bg-white/30",
        glassSecondary:
          "backdrop-blur-sm bg-white/10 border-orange-500/20 text-gray-800 [a&]:hover:bg-white/20",
        // Status-specific variants for file management
        success:
          "backdrop-blur-sm bg-green-100/80 border-green-300/50 text-green-800 [a&]:hover:bg-green-100/90",
        processing:
          "backdrop-blur-sm bg-orange-100/80 border-orange-300/50 text-orange-800 [a&]:hover:bg-orange-100/90 animate-pulse",
        error:
          "backdrop-blur-sm bg-red-100/80 border-red-300/50 text-red-800 [a&]:hover:bg-red-100/90",
        warning:
          "backdrop-blur-sm bg-yellow-100/80 border-yellow-300/50 text-yellow-800 [a&]:hover:bg-yellow-100/90",
        info:
          "backdrop-blur-sm bg-blue-100/80 border-blue-300/50 text-blue-800 [a&]:hover:bg-blue-100/90",
        orange:
          "backdrop-blur-sm bg-orange-100/80 border-orange-300/50 text-orange-800 [a&]:hover:bg-orange-100/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }