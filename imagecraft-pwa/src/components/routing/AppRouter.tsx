/**
 * App Router Component
 * Handles routing with Clerk authentication integration
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, ClerkLoading } from '@clerk/clerk-react';

// Import components
import { Loading } from '../ui/spinner';
import ErrorBoundary from '../ErrorBoundary';
import ProtectedRoute from '../auth/ProtectedRoute';
import ClerkSignIn from '../auth/ClerkSignIn';
import ClerkSignUp from '../auth/ClerkSignUp';
import ClerkUserProfile from '../auth/ClerkUserProfile';

// Import pages
import HomePage from '../../pages/HomePage';
import ConverterPage from '../../pages/ConverterPage';
import EditorPage from '../../pages/EditorPage';
import CollagePage from '../../pages/CollagePage';
import AIPage from '../../pages/AIPage';
import DashboardPage from '../../pages/DashboardPage';
import SettingsPage from '../../pages/SettingsPage';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary level="router">
        <ClerkLoading>
          <div className="min-h-screen flex items-center justify-center">
            <Loading text="Loading authentication..." size="large" />
          </div>
        </ClerkLoading>
        
        <Routes>
          {/* Public routes */}
          <Route
            path="/sign-in/*"
            element={
              <SignedOut>
                <ClerkSignIn routing="path" path="/sign-in" />
              </SignedOut>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <SignedOut>
                <ClerkSignUp routing="path" path="/sign-up" />
              </SignedOut>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <HomePage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/converter"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <ConverterPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <EditorPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/collage"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <CollagePage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <AIPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredTier="premium">
                <SignedIn>
                  <DashboardPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/*"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <ClerkUserProfile routing="path" path="/profile" />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SignedIn>
                  <SettingsPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route
            path="*"
            element={
              <SignedIn>
                <Navigate to="/" replace />
              </SignedIn>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default AppRouter;