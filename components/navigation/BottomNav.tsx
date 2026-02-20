'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  MessageCircle,
  User,
  Settings,
  BarChart3,
  Sun,
  Moon,
  Monitor,
  ArrowLeft,
} from 'lucide-react';
import { BottomNavIcon } from './NavIcon';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface BottomNavProps {
  activeView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  unreadMessages?: number;
  onCreateClick?: () => void;
  className?: string;
}

export function BottomNav({
  activeView = 'home',
  onViewChange,
  unreadMessages = 0,
  onCreateClick,
  className,
}: BottomNavProps) {
  const pathname = usePathname();
  const { isCreator, userProfile, creatorProfile } = useAuth();
  const [currentActiveView, setCurrentActiveView] = useState<DashboardView>('home');

  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/profile') return 'profile';
    
    // Don't auto-detect profile routes anymore - let useEffect handle the specific case
    // of viewing your own profile
    
    return 'home';
  };

  useEffect(() => {
    // console.log('🔍 BottomNav Debug:', { 
    //   pathname, 
    //   userProfile: userProfile?.username,
    //   creatorProfile: creatorProfile?.vanity_username,
    //   userProfileId: userProfile?.id
    // });
    
    let newActiveView = getActiveViewFromPath();
    
    // Workaround: If we're on a dynamic route and it matches current user's username, ensure profile is active
    const segments = pathname?.split('/').filter(Boolean);
    // console.log('🔍 Segments:', segments);
    
    if (segments && segments.length === 1) {
      const [firstSegment] = segments;
      const knownRoutes = ['home', 'explore', 'chat', 'profile', 'settings', 'admin', 'auth', 'api', 'creator-studio', 'signup', 'login', 'about', 'create-post', 'notifications', 'payment'];
      // console.log('🔍 First segment:', firstSegment, 'Is known route:', knownRoutes.includes(firstSegment));
      // console.log('🔍 Username match:', userProfile?.username === firstSegment);
      
      if (!knownRoutes.includes(firstSegment) && userProfile?.username === firstSegment) {
        newActiveView = 'profile';
        // console.log('🔍 Forced profile due to username match');
      }
    }
    
    // Also check for /creator/username routes - use vanity_username from creatorProfile
    if (segments && segments.length === 2 && segments[0] === 'creator') {
      const username = segments[1];
      // console.log('🔍 Creator route username:', username);
      // console.log('🔍 User profile username:', userProfile?.username);
      // console.log('🔍 Creator vanity username:', creatorProfile?.vanity_username);
      // console.log('🔍 Creator username match:', creatorProfile?.vanity_username === username);
      
      // Check against both vanity_username (preferred) and fallback to userProfile.username
      if (creatorProfile?.vanity_username === username || userProfile?.username === username) {
        newActiveView = 'profile';
        // console.log('🔍 Forced profile due to creator username match');
      }
    }
    
    // console.log('🔍 Final active view:', newActiveView);
    setCurrentActiveView(newActiveView);
  }, [pathname, userProfile, creatorProfile]);

  const isCreatorStudioActive = pathname === '/creator-studio';
  const isSignupCreatorActive = pathname === '/signup/creator';

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around',
        'h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]',
        'border-t border-border/20',
        'bg-card/98 backdrop-blur-2xl',
        'md:hidden',
        className,
      )}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <BottomNavIcon icon={Home} label="Home" isActive={currentActiveView === 'home'} href="/home" />
      <BottomNavIcon icon={Search} label="Explore" isActive={currentActiveView === 'explore'} href="/explore" />

      {/* Center: Creator Studio (creators) or Join as creator (non-creators) */}
      <div className="relative -mt-4">
        {isCreator ? (
          <Link
            href="/creator-studio"
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform',
              isCreatorStudioActive
                ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                : 'bg-primary text-primary-foreground',
            )}
            aria-label="Creator Studio"
          >
            <BarChart3 className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        ) : (
          <Link
            href="/signup/creator"
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform',
              isSignupCreatorActive
                ? 'bg-muted text-muted-foreground ring-2 ring-border ring-offset-2 ring-offset-card'
                : 'bg-muted text-foreground border border-border/60',
            )}
            aria-label="Join as creator"
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
          </Link>
        )}
      </div>

      <BottomNavIcon icon={MessageCircle} label="Chat" isActive={currentActiveView === 'chat'} badge={unreadMessages} href="/chat" />
      <BottomNavIcon icon={User} label="Me" isActive={currentActiveView === 'profile'} href="/profile" />
    </motion.nav>
  );
}

// Mobile header
interface MobileHeaderProps {
  title?: string;
  showTabs?: boolean;
  activeTab?: 'for-you' | 'following';
  onTabChange?: (tab: 'for-you' | 'following') => void;
  onSettingsClick?: () => void;
  hideHeader?: boolean;
  className?: string;
}

export function MobileHeader({
  title = 'MeroCircle',
  showTabs = false,
  activeTab = 'for-you',
  onTabChange,
  onSettingsClick,
  hideHeader = false,
  className,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  // Smart back button logic
  useEffect(() => {
    const checkShouldShowBackButton = () => {
      // List of routes that should show back button
      const routesWithBackButton = [
        '/explore',
        '/chat',
        '/profile',
        '/settings',
        '/notifications',
        '/creator-studio',
        '/admin',
        '/about',
        '/create-post',
        '/payment'
      ];
      
      // Check if current path starts with any of these routes
      const shouldShow = routesWithBackButton.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      );
      
      // Also check for dynamic routes like /creator/username or /username
      const segments = pathname?.split('/').filter(Boolean);
      if (segments && segments.length >= 1) {
        const [firstSegment] = segments;
        const knownStaticRoutes = ['home', 'explore', 'chat', 'profile', 'settings', 'admin', 'auth', 'api', 'creator-studio', 'signup', 'login', 'about', 'create-post', 'notifications', 'payment'];
        
        // If it's a dynamic route (not a known static route) and not the home page
        if (!knownStaticRoutes.includes(firstSegment) && pathname !== '/home') {
          setShowBackButton(true);
          return;
        }
      }
      
      setShowBackButton(shouldShow && pathname !== '/home');
    };
    
    checkShouldShowBackButton();
  }, [pathname]);
  
  const toggleTheme = () => {
    // Cycle: system -> light -> dark -> system
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };
  
  const handleBack = () => {
    // Use router.back() which is the standard way to go back
    router.back();
  };
  
  if (hideHeader) return null;

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'flex flex-col',
        'border-b border-border/20',
        'bg-background/85 backdrop-blur-2xl',
        'pt-[env(safe-area-inset-top)]',
        'md:hidden',
        className,
      )}
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-muted/60 transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label="Go back"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-muted-foreground" />
            </motion.button>
          )}
          <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted/60 transition-colors"
            whileTap={{ scale: 0.95 }}
            aria-label={!mounted ? 'Theme' : theme === 'system' ? 'System Theme' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          >
            {!mounted ? <Monitor className="w-4.5 h-4.5 text-muted-foreground" /> : theme === 'system' ? <Monitor className="w-4.5 h-4.5 text-muted-foreground" /> : theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-muted-foreground" /> : <Moon className="w-4.5 h-4.5 text-muted-foreground" />}
          </motion.button>
          <motion.button
            onClick={onSettingsClick}
            className="p-2 rounded-full hover:bg-muted/60 transition-colors"
            whileTap={{ scale: 0.95 }}
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {showTabs && (
        <div className="flex items-center gap-6 px-4 pb-2">
          <button
            onClick={() => onTabChange?.('for-you')}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              activeTab === 'for-you' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            For You
            {activeTab === 'for-you' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => onTabChange?.('following')}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Following
            {activeTab === 'following' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      )}
    </motion.header>
  );
}