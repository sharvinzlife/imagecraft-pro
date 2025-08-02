/**
 * Clerk Authentication Configuration
 * Browser-only authentication setup
 */

// Clerk publishable key - you'll need to set this in your environment
export const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_your_publishable_key';

// Glass morphism appearance theme for Clerk components
export const clerkAppearance = {
  baseTheme: 'light',
  variables: {
    colorPrimary: '#f97316', // Orange theme
    colorBackground: 'rgba(255, 255, 255, 0.1)',
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorInputBackground: 'rgba(255, 255, 255, 0.2)',
    colorInputText: '#1f2937',
    borderRadius: '0.75rem',
  },
  elements: {
    card: {
      backdropFilter: 'blur(20px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    headerTitle: {
      color: '#1f2937',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: '#6b7280',
    },
    formButtonPrimary: {
      backgroundColor: '#f97316',
      '&:hover': {
        backgroundColor: '#ea580c',
      },
    },
    formFieldInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      '&:focus': {
        borderColor: '#f97316',
        boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)',
      },
    },
  },
};

// Localization settings
export const clerkLocalization = {
  locale: 'en-US',
};

// Routing configuration for single-page app
export const clerkRouting = {
  routing: 'path' as const,
  path: '/',
};