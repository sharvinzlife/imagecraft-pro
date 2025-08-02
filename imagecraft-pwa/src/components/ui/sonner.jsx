"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = ({
  position = "top-right",
  expand = false,
  richColors = true,
  closeButton = true,
  ...props
}) => {
  return (
    <Sonner
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "glass-toast group toast group-[.toaster]:bg-white/90 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-orange-500/20 group-[.toaster]:text-gray-900 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-600",
          actionButton: "group-[.toast]:bg-orange-500 group-[.toast]:text-white group-[.toast]:hover:bg-orange-600",
          cancelButton: "group-[.toast]:bg-gray-200 group-[.toast]:text-gray-900 group-[.toast]:hover:bg-gray-300",
          closeButton: "group-[.toast]:border-orange-500/20 group-[.toast]:hover:bg-orange-50",
          success: "group-[.toast]:border-green-500/20 group-[.toast]:text-green-900",
          error: "group-[.toast]:border-red-500/20 group-[.toast]:text-red-900",
          warning: "group-[.toast]:border-yellow-500/20 group-[.toast]:text-yellow-900",
          info: "group-[.toast]:border-blue-500/20 group-[.toast]:text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }