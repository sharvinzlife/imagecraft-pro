/**
 * Navigation Component
 * Main navigation with authentication-aware routing
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  SignedIn, 
  SignedOut, 
  UserButton,
  useUser 
} from '@clerk/clerk-react';
import { 
  Image, 
  Menu, 
  User,
  LayoutGrid,
  Settings,
  Home,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  requiresAuth?: boolean;
}

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();

  const navItems: NavItem[] = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, requiresAuth: true },
    { to: '/profile', label: 'Profile', icon: User, requiresAuth: true },
    { to: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  const MobileMenu = () => (
    <div className="space-y-4">
      {/* Logo in mobile menu */}
      <div className="flex items-center space-x-3 pb-4 border-b border-white/20">
        <div 
          className="p-2 rounded-lg shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c)'
          }}
        >
          <Image className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-800">ImageCraft Pro</span>
      </div>

      {/* Navigation Links */}
      <div className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-orange-100/70 text-orange-700 font-semibold'
                  : 'text-gray-700 hover:bg-white/60 hover:text-orange-600'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Auth Section */}
      <div className="pt-4 border-t border-white/20">
        <SignedIn>
          <div className="flex items-center space-x-3 p-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                  userButtonPopoverCard: 'glass-card border border-white/20'
                }
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-600">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="space-y-2">
            <Link to="/sign-in" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start glass-hover"
              >
                <LogIn className="w-4 h-4 mr-3" />
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="glassPrimary"
                className="w-full justify-start"
              >
                <UserPlus className="w-4 h-4 mr-3" />
                Sign Up
              </Button>
            </Link>
          </div>
        </SignedOut>
      </div>
    </div>
  );

  return (
    <header className="relative z-10">
      <Card variant="glass" className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-4 group">
                <div 
                  className="p-3 rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #fb923c)'
                  }}
                >
                  <Image className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h1 
                  className="text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-orange-600"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  ImageCraft Pro
                </h1>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium',
                        isActive
                          ? 'bg-orange-100/70 text-orange-700'
                          : 'text-gray-700 hover:bg-white/60 hover:text-orange-600'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-4">
                <SignedIn>
                  <div className="flex items-center space-x-3">
                    <span className="hidden lg:inline text-sm text-gray-700">
                      {user?.firstName || user?.username || 'User'}
                    </span>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9',
                          userButtonPopoverCard: 'glass-card border border-white/20',
                          userButtonPopoverActionButton: 'hover:bg-orange-50/50 hover:text-orange-600'
                        }
                      }}
                    />
                  </div>
                </SignedIn>

                <SignedOut>
                  <div className="flex items-center space-x-2">
                    <Link to="/sign-in">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="glass-hover text-gray-700 hover:text-orange-600"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/sign-up">
                      <Button
                        variant="glassPrimary"
                        size="sm"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </SignedOut>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="glass-hover"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-80 sm:w-96 glass-card border-l border-white/20"
                  >
                    <MobileMenu />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </header>
  );
};

export default Navigation;