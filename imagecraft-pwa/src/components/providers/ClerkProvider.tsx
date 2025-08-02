/**
 * Clerk Provider Component
 * Wraps the application with Clerk authentication provider
 * Includes glass morphism styling and accessibility features
 */

import React from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

interface ClerkProviderProps {
  children: React.ReactNode;
}

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_your_publishable_key';

const clerkAppearance = {
  baseTheme: 'light' as const,
  variables: {
    colorPrimary: '#f97316',
    colorBackground: 'rgba(255, 255, 255, 0.1)',
    colorText: '#1f2937',
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
  },
};

export const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  return (
    <BaseClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      routing="path"
      path="/"
    >
      {children}
    </BaseClerkProvider>
  );
};

export default ClerkProvider;