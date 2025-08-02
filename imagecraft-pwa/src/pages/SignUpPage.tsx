/**
 * Sign Up Page Component
 * Custom sign-up page with glass morphism design
 */

import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-cream-50 to-orange-25 relative overflow-hidden">
      {/* Background decorative elements - light and elegant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cream-200/25 rounded-full blur-3xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl animate-gentle-breathe delay-1000"></div>
        <div className="absolute top-3/4 right-1/2 w-32 h-32 bg-orange-100/30 rounded-full blur-2xl animate-gentle-breathe delay-500"></div>
        <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-cream-300/20 rounded-full blur-xl animate-float2"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Back to Home Button */}
          <div className="flex justify-start mb-6">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="card-glass-cream-accessible text-gray-700 hover:text-orange-600 transition-all duration-200 border-0 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-4">
            <div className="card-glass-peach-accessible p-3 mr-3 shadow-lg">
              <Sparkles className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              ImageCraft <span className="text-orange-600">Pro</span>
            </h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Join thousands of creators and start your image editing journey!
          </p>
        </div>

        {/* Sign Up Component Container */}
        <div className="card-glass-cream-accessible p-8 shadow-2xl border border-white/30">
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
                  card-glass-cream-accessible border border-orange-200/50 text-gray-700 
                  hover:border-orange-300 hover:bg-orange-50/50 
                  transition-all duration-200 font-medium min-h-[44px] shadow-sm
                `,
                formButtonPrimary: `
                  btn-glass-orange-accessible text-white font-semibold py-3 px-6 
                  transition-all duration-200 shadow-lg hover:shadow-xl 
                  min-h-[44px] focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                `,
                formFieldInput: `
                  glass-input border border-gray-200/50 bg-white/80 backdrop-blur-sm
                  focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 
                  transition-all duration-200 min-h-[44px] text-gray-900
                `,
                formFieldLabel: 'text-gray-700 font-medium mb-2',
                footerActionText: 'text-gray-600',
                footerActionLink: 'text-orange-600 hover:text-orange-700 font-semibold',
                dividerLine: 'bg-gray-200/60',
                dividerText: 'text-gray-500 text-sm',
                alertText: 'text-red-600 text-sm',
              }
            }}
          />
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link 
              to="/sign-in" 
              className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Features Included */}
        <div className="card-glass-peach-accessible mt-8 p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What's Included
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Unlimited image processing</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Cloud storage for your projects</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Advanced editing tools</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Custom collage templates</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Priority customer support</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-sm">Mobile app access</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            By signing up, you agree to our{' '}
            <button type="button" className="text-orange-600 hover:underline focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm" onClick={() => window.location.href='/terms'}>Terms of Service</button>{' '}
            and{' '}
            <button type="button" className="text-orange-600 hover:underline focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm" onClick={() => window.location.href='/privacy'}>Privacy Policy</button>
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4 text-xs text-gray-500">
            <span>🔒 SSL Encrypted</span>
            <span>•</span>
            <span>⚡ Instant Setup</span>
            <span>•</span>
            <span>✨ Free Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;