import React from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Image } from 'lucide-react';
import { Button } from './ui/button';

const SimpleNavigation = () => {
  return (
    <nav className="backdrop-blur-md bg-white/20 border-b border-white/30 shadow-lg sticky top-0 z-40 transition-all duration-300 hover:bg-white/25 hover:border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3 transform-gpu">
              <Image className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="transition-all duration-300 group-hover:translate-x-1">
              <h1 className="text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-orange-600" style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
                ImageCraft Pro
              </h1>
              <p className="text-xs text-slate-600 font-medium transition-colors duration-300 group-hover:text-slate-700" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                Professional Image Processing
              </p>
            </div>
          </div>

          {/* Authentication */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button 
                  variant="glassSecondary" 
                  size="sm"
                  className="transition-all duration-500 hover:scale-105 hover:shadow-xl group"
                >
                  <span className="relative z-10">Sign In</span>
                </Button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-700 font-medium hidden sm:block transition-all duration-300 hover:text-orange-600" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                  Welcome back!
                </div>
                <div className="relative">
                  {/* Floating decoration around avatar */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-300/20 to-pink-300/20 rounded-full blur-sm animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 ring-2 ring-orange-200/60 hover:ring-orange-400/80 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl backdrop-blur-sm",
                        userPreviewMainIdentifier: "text-slate-900 font-semibold",
                        userPreviewSecondaryIdentifier: "text-slate-600",
                        card: "backdrop-blur-xl bg-white/95 border border-orange-500/20 shadow-2xl",
                        headerTitle: "text-slate-900 font-semibold",
                        headerSubtitle: "text-slate-600",
                        navbarButton: "text-slate-700 hover:text-orange-600 hover:bg-orange-50/50",
                        navbarButtonIcon: "text-slate-600 hover:text-orange-600",
                        profileSectionTitle: "text-slate-900 font-semibold",
                        profileSectionContent: "text-slate-700",
                        menuButton: "text-slate-700 hover:text-orange-600 hover:bg-orange-50/50",
                        menuButtonIcon: "text-slate-600 hover:text-orange-600"
                      },
                      layout: {
                        showOptionalFields: true
                      }
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
      
      {/* Subtle floating elements for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-10 w-2 h-2 bg-gradient-to-r from-orange-300/30 to-pink-300/30 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-4 left-20 w-1.5 h-1.5 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-sm animate-float3" />
      </div>
    </nav>
  );
};

export default SimpleNavigation;