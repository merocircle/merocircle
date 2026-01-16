"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Crown,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { cn } from '@/lib/utils';
import { spacing, layout, responsive, colors, typography } from '@/lib/tailwind-utils';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, userProfile, isAuthenticated, isCreator, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      // Silently handle error
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const profileMenuItems = [
    {
      icon: User,
      label: 'My Profile',
      href: '/profile'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings'
    },
    {
      icon: BarChart3,
      label: 'Creator Dashboard',
      href: '/dashboard/creator'
    },
    {
      icon: Heart,
      label: 'Dashboard',
      href: '/dashboard'
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      onClick: handleSignOut
    }
  ];

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 dark:bg-gray-950/95 dark:border-gray-800 shadow-sm')}>
      <div className={cn(spacing.container, layout.flexBetween, 'h-14 sm:h-16')}>
        <Link href="/" className={cn(layout.flexRow, 'space-x-2 sm:space-x-3 group')} onClick={closeMobileMenu}>
          <div className={cn('relative', responsive.iconMedium, 'text-red-500 group-hover:scale-110 transition-transform')}>
            <Heart className="absolute inset-0 fill-red-500" />
            <Heart className="absolute inset-0 animate-pulse" />
          </div>
          <span className={cn('text-lg sm:text-xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent')}>
            Creators Nepal
          </span>
        </Link>

        <nav className={cn('hidden md:flex', layout.flexRow, 'space-x-6 items-center')}>
          <Link 
            href="/discover" 
            className={cn('text-sm font-medium transition-all hover:text-primary relative group', colors.text.secondary)}
          >
            Discover
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="/dashboard"
            className={cn('text-sm font-medium transition-all hover:text-primary relative group', colors.text.secondary)}
          >
            Browse Creators
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          {isAuthenticated && (
            <>
              <Link 
                href="/dashboard" 
                className={cn('text-sm font-medium transition-all hover:text-primary relative group', colors.text.secondary)}
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
              <Link 
                href="/community" 
                className={cn('p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800', colors.text.secondary)}
                title="Community"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </>
          )}
        </nav>

        <div className={cn(layout.flexRow, 'space-x-4')}>
          {loading && !isAuthenticated ? (
            <div className="w-8 h-8 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full" />
          ) : isAuthenticated && user ? (
            // User Profile Menu
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {userProfile?.photo_url ? (
                    <img 
                      src={userProfile.photo_url} 
                      alt={userProfile.display_name || user.email || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className={cn(layout.flexRow, 'space-x-1')}>
                    <span className={cn(typography.small, 'font-medium', colors.text.primary)}>
                      {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                    </span>
                    {isCreator && <Crown className={cn(responsive.icon, 'text-yellow-500')} />}
                  </div>
                  <span className={cn(typography.small, colors.text.muted, 'capitalize')}>
                    {userProfile?.role || 'user'}
                  </span>
                </div>
                <ChevronDown className={cn(responsive.icon, colors.text.muted)} />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl backdrop-blur-md py-2"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    
                    {profileMenuItems.map((item, index) => (
                      <div key={index}>
                        {item.onClick ? (
                          <button
                            onClick={item.onClick}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        ) : (
                          <Link
                            href={item.href!}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Guest Navigation
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950"
          >
            <div className="px-4 py-4 space-y-4">
              <Link 
                href="/discover" 
                className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                onClick={closeMobileMenu}
              >
                Discover
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                onClick={closeMobileMenu}
              >
                Browse Creators
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/community" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Community</span>
                  </Link>
                </>
              )}

              {!isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <Link href="/auth" onClick={closeMobileMenu}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {profileMenuItems.map((item, index) => (
                    <div key={index}>
                      {item.onClick ? (
                        <button
                          onClick={() => {
                            item.onClick!();
                            closeMobileMenu();
                          }}
                          className="w-full flex items-center space-x-3 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href!}
                          className="flex items-center space-x-3 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 
