/**
 * Profile Page Component
 * User profile management with Clerk UserProfile
 */

import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Settings, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-cream-50 to-orange-25 relative overflow-hidden">
      {/* Background decorative elements - light and elegant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/6 left-1/5 w-48 h-48 bg-orange-200/15 rounded-full blur-3xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/5 right-1/4 w-32 h-32 bg-cream-200/20 rounded-full blur-2xl animate-gentle-breathe delay-1000"></div>
        <div className="absolute top-2/3 left-1/3 w-24 h-24 bg-orange-100/25 rounded-full blur-xl animate-float1"></div>
      </div>
      {/* Header */}
      <div className="card-glass-cream-accessible mx-4 mt-4 mb-8 shadow-lg border border-white/30 relative z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="card-glass-peach-accessible text-gray-700 hover:text-orange-600 border-0 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300/50"></div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="w-6 h-6 mr-2 text-orange-600" />
              Profile Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8 relative z-10">
        <div className="card-glass-cream-accessible p-8 shadow-2xl border border-white/30">
          {/* Custom Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Your Account
            </h2>
            <p className="text-gray-600">
              Update your profile information, security settings, and preferences.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card-glass-peach-accessible p-6 text-center shadow-lg border border-white/20">
              <User className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Personal Info</h3>
              <p className="text-sm text-gray-600">
                Update your name, email, and profile picture
              </p>
            </div>
            <div className="card-glass-peach-accessible p-6 text-center shadow-lg border border-white/20">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
              <p className="text-sm text-gray-600">
                Manage passwords and two-factor authentication
              </p>
            </div>
            <div className="card-glass-peach-accessible p-6 text-center shadow-lg border border-white/20">
              <Settings className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Preferences</h3>
              <p className="text-sm text-gray-600">
                Customize notifications and app settings
              </p>
            </div>
          </div>

          {/* Clerk UserProfile Component */}
          <div className="card-glass-cream-accessible p-6 shadow-lg border border-white/25 backdrop-blur-md">
            <UserProfile 
              routing="path"
              path="/profile"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none bg-transparent border-0',
                  navbar: 'card-glass-peach-accessible border border-white/30 rounded-xl mb-6 shadow-sm',
                  navbarButton: `
                    text-gray-700 hover:text-orange-600 hover:bg-orange-50/50 
                    rounded-lg transition-all duration-200 font-medium px-4 py-2
                  `,
                  navbarButtonActive: 'text-orange-600 bg-orange-50/70',
                  profileSectionTitleText: 'text-xl font-semibold text-gray-900',
                  profileSectionContent: 'card-glass-cream-accessible rounded-xl p-4 border border-white/25 shadow-sm',
                  formButtonPrimary: `
                    btn-glass-orange-accessible text-white font-semibold py-2 px-4 
                    transition-all duration-200 shadow-lg hover:shadow-xl 
                    min-h-[44px] focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  `,
                  formButtonSecondary: `
                    card-glass-cream-accessible border border-gray-200/50 text-gray-700 
                    hover:border-orange-300 hover:bg-orange-50/50 
                    transition-all duration-200 font-medium rounded-xl shadow-sm
                  `,
                  formFieldInput: `
                    glass-input border border-gray-200/50 bg-white/80 backdrop-blur-sm
                    focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 
                    transition-all duration-200 min-h-[44px] text-gray-900
                  `,
                  formFieldLabel: 'text-gray-700 font-medium mb-2',
                  badge: 'bg-orange-100 text-orange-800 rounded-full px-2 py-1 text-xs font-medium',
                  alertText: 'text-red-600 text-sm',
                  successText: 'text-green-600 text-sm',
                }
              }}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Need help? Contact our{' '}
              <button type="button" className="text-orange-600 hover:underline font-medium focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm" onClick={() => window.location.href='/support'}>
                support team
              </button>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;