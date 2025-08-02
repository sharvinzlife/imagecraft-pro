/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode disabled to maintain consistent light glass morphism theme
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom cream and orange color palette for glassmorphism
        cream: {
          25: '#fefef9',
          50: '#fefdf0',
          100: '#fefbe8',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        orange: {
          25: '#fffaf7',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      addUtilities({
        // True Glass Morphism Utilities - Professional and Modern
        '.glass-white-accessible': {
          'background': 'rgba(255, 255, 255, 0.15)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
          'color': '#0f172a',
          'text-shadow': '0 1px 3px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(255, 255, 255, 0.5)',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        },
        '.glass-white-subtle': {
          'background': 'rgba(255, 255, 255, 0.08)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'color': '#0f172a',
          'text-shadow': '0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(255, 255, 255, 0.3)',
          'box-shadow': '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        },
        // glass-dark-accessible removed to maintain consistent light theme
        '.glass-orange-accessible': {
          'background': 'rgba(234, 88, 12, 0.12)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
          'color': '#0f172a',
          'text-shadow': '0 1px 3px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(255, 255, 255, 0.5)',
          'box-shadow': '0 8px 32px rgba(234, 88, 12, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        },
        // Interactive States - Professional glass effects
        '.glass-hover': {
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'background': 'rgba(255, 255, 255, 0.2)',
            'border-color': 'rgba(255, 255, 255, 0.4)',
            'transform': 'translateY(-1px) scale(1.02)',
            'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }
        },
        '.glass-focus': {
          '&:focus-visible': {
            'outline': 'none',
            'border-color': 'rgba(234, 88, 12, 0.8)',
            'box-shadow': '0 0 0 3px rgba(234, 88, 12, 0.2), 0 8px 25px rgba(234, 88, 12, 0.15)'
          }
        },
        // Button Variants - True glass morphism
        '.btn-glass-primary': {
          'background': 'linear-gradient(135deg, rgba(234, 88, 12, 0.8) 0%, rgba(194, 65, 12, 0.9) 100%)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
          'color': '#ffffff',
          'text-shadow': '0 1px 3px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4)',
          'font-weight': '600',
          'min-height': '44px',
          'min-width': '44px',
          'border-radius': '0.75rem',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'box-shadow': '0 4px 16px rgba(234, 88, 12, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          '&:hover': {
            'background': 'linear-gradient(135deg, rgba(234, 88, 12, 0.9) 0%, rgba(194, 65, 12, 0.95) 100%)',
            'border-color': 'rgba(255, 255, 255, 0.4)',
            'transform': 'translateY(-1px) scale(1.02)',
            'box-shadow': '0 8px 25px rgba(234, 88, 12, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          },
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 3px rgba(30, 64, 175, 0.4), 0 8px 25px rgba(234, 88, 12, 0.3)'
          },
          '&:active': {
            'transform': 'translateY(0)'
          }
        },
        '.btn-glass-secondary': {
          'background': 'rgba(255, 255, 255, 0.15)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
          'color': '#0f172a',
          'text-shadow': '0 1px 3px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(255, 255, 255, 0.5)',
          'font-weight': '600',
          'min-height': '44px',
          'min-width': '44px',
          'border-radius': '0.75rem',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'box-shadow': '0 4px 16px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          '&:hover': {
            'background': 'rgba(255, 255, 255, 0.25)',
            'border-color': 'rgba(255, 255, 255, 0.4)',
            'transform': 'translateY(-1px) scale(1.02)',
            'box-shadow': '0 8px 25px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
          },
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 3px rgba(30, 64, 175, 0.4), 0 8px 25px rgba(255, 255, 255, 0.2)'
          },
          '&:active': {
            'transform': 'translateY(0)'
          }
        },
        // Link Variants
        '.link-glass-accessible': {
          'color': '#ea580c',
          'text-shadow': '0 1px 2px rgba(255, 255, 255, 0.6)',
          'font-weight': '600',
          'text-decoration': 'none',
          'border-radius': '0.25rem',
          'padding': '0.125rem 0.25rem',
          'transition': 'all 0.2s ease',
          '&:hover': {
            'color': '#c2410c',
            'text-decoration': 'underline',
            'background': 'rgba(234, 88, 12, 0.1)'
          },
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 2px rgba(234, 88, 12, 0.6)'
          }
        },
        // Utility classes for scaling
        '.scale-102': {
          'transform': 'scale(1.02)'
        },
        
        // New gentle animations - now defined in index.css
        '.animate-gentle-pulse': {
          'animation': 'gentle-pulse 2s ease-in-out infinite'
        },
        '.animate-gentle-breathe': {
          'animation': 'gentle-breathe 4s ease-in-out infinite'
        },
        
        // High Contrast Mode Support
        '@media (prefers-contrast: high)': {
          '.glass-white-accessible, .glass-white-subtle': {
            'background': 'rgba(255, 255, 255, 0.95)',
            'border': '2px solid rgba(0, 0, 0, 0.8)',
            'backdrop-filter': 'blur(8px)',
            '-webkit-backdrop-filter': 'blur(8px)'
          },
          // glass-dark-accessible removed from high contrast mode
          '.glass-orange-accessible, .btn-glass-primary': {
            'background': 'linear-gradient(135deg, rgba(234, 88, 12, 0.95) 0%, rgba(194, 65, 12, 0.98) 100%)',
            'border': '2px solid rgba(255, 255, 255, 0.8)',
            'backdrop-filter': 'blur(8px)',
            '-webkit-backdrop-filter': 'blur(8px)'
          }
        },
        // Mobile-first improvements
        '@media (max-width: 768px)': {
          '.btn-glass-primary, .btn-glass-secondary': {
            'min-height': '48px', // Larger touch targets on mobile
            'min-width': '48px',
            'font-size': '1rem'
          },
          '.glass-white-accessible, .glass-white-subtle, .glass-orange-accessible': {
            'backdrop-filter': 'blur(12px)', // Reduced blur for better mobile performance
            '-webkit-backdrop-filter': 'blur(12px)'
          }
        },
        
        // Reduced Motion Support
        '@media (prefers-reduced-motion: reduce)': {
          '.glass-hover, .btn-glass-primary, .btn-glass-secondary, .link-glass-accessible, .animate-gentle-pulse, .animate-gentle-breathe': {
            'transition': 'none',
            'animation': 'none'
          }
        }
      })
    }
  ],
}