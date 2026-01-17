'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Home,
  MessageCircle,
  Bell,
  Settings,
  Menu,
  X,
  Heart,
  User,
  LogOut,
  Crown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface RecentlyVisited {
  id: string;
  name: string;
  avatar?: string;
  type: 'creator' | 'channel';
  href: string;
}

// Theme toggle button for sidebar
function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" className="w-full justify-start">
        <div className="w-5 h-5 mr-3" />
        <span>Theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 mr-3" />
      ) : (
        <Sun className="w-5 h-5 mr-3" />
      )}
      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
    </Button>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, isAuthenticated, isCreator, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [recentlyVisited, setRecentlyVisited] = useState<RecentlyVisited[]>([]);
  
  // Get real-time unread count for notifications badge
  const { unreadCount } = useNotifications();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Chats', href: '/community', icon: MessageCircle },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Load and validate recently visited from localStorage
  useEffect(() => {
    const loadAndValidateRecentlyVisited = async () => {
      const stored = localStorage.getItem('recentlyVisited');
      if (!stored) return;

      try {
        const items: RecentlyVisited[] = JSON.parse(stored);
        
        // Validate each item by checking if the creator still exists
        const validatedItems = await Promise.all(
          items.map(async (item) => {
            if (item.type === 'creator') {
              try {
                const response = await fetch(`/api/creator/${item.id}`);
                if (!response.ok) {
                  // Creator doesn't exist, filter it out
                  return null;
                }
                const data = await response.json();
                // Update with current data in case name/avatar changed
                return {
                  ...item,
                  name: data.display_name || item.name,
                  avatar: data.photo_url || item.avatar,
                };
              } catch (error) {
                // Error fetching creator, assume it doesn't exist
                return null;
              }
            }
            // For channels, keep as is (can add validation later if needed)
            return item;
          })
        );

        // Filter out null values (deleted creators) and update state
        const validItems = validatedItems.filter((item): item is RecentlyVisited => item !== null);
        
        // Update localStorage with cleaned list
        if (validItems.length !== items.length) {
          localStorage.setItem('recentlyVisited', JSON.stringify(validItems));
        }
        
        setRecentlyVisited(validItems);
      } catch (e) {
        console.error('Failed to parse recently visited', e);
        // Clear corrupted data
        localStorage.removeItem('recentlyVisited');
        setRecentlyVisited([]);
      }
    };

    loadAndValidateRecentlyVisited();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-900 shadow-lg"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center space-x-2 group">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="text-lg font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              MeroCircle
            </span>
          </Link>
        </div>

        {/* User Profile Section */}
        {isAuthenticated && user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userProfile?.photo_url || undefined} alt={userProfile?.display_name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {userProfile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  {isCreator && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userProfile?.role || 'user'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Recently Visited Section */}
          {recentlyVisited.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-3" />
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Recently Visited
              </h3>
              <div className="space-y-1">
                {recentlyVisited.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={item.avatar} alt={item.name} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {item.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">
                      {item.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {isAuthenticated && (
            <div className="mt-6">
              <Separator className="mb-3" />
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </Link>
                {isCreator && (
                  <Link
                    href="/dashboard/creator"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Crown className="w-5 h-5" />
                    <span>Creator Dashboard</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          {isAuthenticated && (
            <ThemeToggleButton />
          )}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          ) : (
            <Link href="/auth">
              <Button className="w-full">Get Started</Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
