/**
 * Sign Up Page Component - WCAG 2.1 AA Enhanced
 * Custom sign-up page with glass morphism design and full accessibility compliance
 */

import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, Shield, Zap, Sparkles as SparklesIcon } from 'lucide-react';
import { Button } from '../components/ui/button';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-orange-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 right-1/2 w-32 h-32 bg-green-300/30 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          {/* Back to Home Button */}
          <div className="flex justify-start mb-6">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="glass-hover text-gray-700 hover:text-orange-600 transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label="Return to homepage"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-4">
            <div className="glass-card p-3 mr-3" role="img" aria-label="ImageCraft Pro logo icon">
              <Sparkles className="w-8 h-8 text-orange-600" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              ImageCraft <span className="text-orange-600">Pro</span>
            </h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Join thousands of creators and start your image editing journey!
          </p>
        </header>

        {/* Sign Up Component Container */}
        <main 
          id="main-content" 
          className="glass-card p-8 shadow-2xl" 
          role="main" 
          aria-labelledby="signup-heading"
        >
          <SignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent border-0',
                headerTitle: 'text-2xl font-semibold text-gray-900 mb-2',
                headerSubtitle: 'text-gray-600 mb-6',
                socialButtonsBlockButton: `
                  glass-hover border border-orange-200/50 text-gray-700 
                  hover:border-orange-300 hover:bg-orange-50/50 
                  transition-all duration-200 font-medium
                  focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  min-h-[44px] min-w-[44px]
                `,
                formButtonPrimary: `
                  bg-gradient-to-r from-orange-500 to-orange-600 
                  hover:from-orange-600 hover:to-orange-700 
                  text-white font-semibold py-3 px-6 rounded-xl 
                  transition-all duration-200 shadow-lg 
                  hover:shadow-xl hover:scale-105
                  focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  min-h-[44px]
                `,
                formFieldInput: `
                  glass-input border border-gray-200/50 
                  focus:border-orange-400 focus:ring-2 
                  focus:ring-orange-400/20 transition-all duration-200
                  min-h-[44px] text-gray-900
                `,
                formFieldLabel: 'text-gray-700 font-medium mb-2',
                footerActionText: 'text-gray-600',
                footerActionLink: `
                  text-orange-600 hover:text-orange-700 font-semibold
                  focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                  rounded-sm
                `,
                dividerLine: 'bg-gray-200/60',
                dividerText: 'text-gray-500 text-sm',
                alertText: 'text-red-600 text-sm',
                alert: 'role="alert" aria-live="polite" bg-red-50 border border-red-200 rounded-lg p-3',
                formFieldError: 'text-red-600 text-sm mt-1',
                formFieldSuccess: 'text-green-600 text-sm mt-1',
                formFieldWarning: 'text-amber-600 text-sm mt-1',
                formFieldHint: 'text-gray-500 text-xs mt-1',
              }
            }}
          />
        </main>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link 
              to="/sign-in" 
              className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Features Included */}
        <aside 
          className="glass-card mt-8 p-6" 
          role="complementary" 
          aria-labelledby="features-title"
        >
          <h2 id="features-title" className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What's Included
          </h2>
          <ul className="space-y-3" role="list">
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Unlimited image processing</span>
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Cloud storage for your projects</span>
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Advanced editing tools</span>
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Custom collage templates</span>
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Priority customer support</span>
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">Mobile app access</span>
            </li>
          </ul>
        </aside>

        {/* Trust Indicators */}
        <footer className="text-center mt-6">
          <p className="text-gray-400 text-xs">
            By signing up, you agree to our{' '}
            <a 
              href="/terms" 
              className="text-orange-600 hover:underline focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm"
              aria-label="Terms of Service (opens in new page)"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a 
              href="/privacy" 
              className="text-orange-600 hover:underline focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm"
              aria-label="Privacy Policy (opens in new page)"
            >
              Privacy Policy
            </a>
          </p>
          <div 
            className="flex items-center justify-center mt-4 space-x-4 text-xs text-gray-400"
            role="list"
            aria-label="Security and features"
          >
            <span className="flex items-center" role="listitem">
              <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
              SSL Encrypted
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center" role="listitem">
              <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
              Instant Setup
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center" role="listitem">
              <SparklesIcon className="w-3 h-3 mr-1" aria-hidden="true" />
              Free Forever
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SignUpPage;