/**
 * Main App Component with React Router
 * Handles routing, authentication, and layout
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClerkProvider } from './components/providers/ClerkProvider.tsx';
import { AppProvider } from './store/appStore';
import ErrorBoundary from './components/ErrorBoundary';
import AnimatedBackground from './components/AnimatedBackground';
import NotificationSystem from './components/NotificationSystem';
// NetworkStatus removed - browser-only app
import { Loading } from './components/ui/spinner';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const SignInPage = lazy(() => import('./pages/SignInPage.tsx'));
const SignUpPage = lazy(() => import('./pages/SignUpPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
// DashboardPage removed - using simplified app structure
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="glass-card p-8 text-center">
      <Loading size="large" text="Loading..." />
    </div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/sign-in' 
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (!isSignedIn) {
    // Save the attempted location for redirect after sign in
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to home if already signed in)
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (isSignedIn) {
    // Redirect to the page they were trying to visit or home
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Route transitions
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

// Animated Routes Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="min-h-screen"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            
            {/* Auth Routes (redirect if already signed in) */}
            <Route 
              path="/sign-in" 
              element={
                <PublicRoute>
                  <SignInPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/sign-up" 
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            {/* Dashboard removed - simplified app structure */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClerkProvider>
        <AppProvider>
          <BrowserRouter>
            <div className="relative min-h-screen">
              {/* Background Animation */}
              <AnimatedBackground />
              
              {/* Global Components */}
              <NotificationSystem />
              
              {/* Routed Content */}
              <AnimatedRoutes />
            </div>
          </BrowserRouter>
        </AppProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
};

export default App;