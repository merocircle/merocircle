'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Bell,
  BarChart3,
  Settings,
  Heart,
  User,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavIcon } from './NavIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { type DashboardView } from '@/contexts/dashboard-context';

import Logo from "@/components/ui/logo.svg";

interface ActivityBarProps {
  user?: {
    id: string;
    display_name: string;
    photo_url: string | null;
  } | null;
  activeView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  unreadMessages?: number;
  unreadNotifications?: number;
  favoriteCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
  }>;
  onCreatorClick?: (creatorId: string) => void;
  className?: string;
}

type NavItem = {
  id: string;
  icon: typeof Home;
  label: string;
  view?: DashboardView;
  badge?: number;
};

export function ActivityBar({
  user,
  activeView = 'home',
  onViewChange,
  unreadMessages = 0,
  unreadNotifications = 0,
  favoriteCreators = [],
  onCreatorClick,
  className
}: ActivityBarProps) {
  const pathname = usePathname();
  const { isCreator } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Map view to route
  const getRoute = (view: DashboardView | undefined): string => {
    switch (view) {
      case 'home': return '/home';
      case 'explore': return '/explore';
      case 'chat': return '/chat';
      case 'notifications': return '/notifications';
      case 'settings': return '/settings';
      case 'profile': return '/profile';
      case 'creator-studio': return '/creator-studio';
      default: return '/home';
    }
  };

  // Get active view from pathname
  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/notifications') return 'notifications';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/creator-studio') return 'creator-studio';
    return 'home';
  };

  const currentActiveView = getActiveViewFromPath();

  // Main navigation items
  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', view: 'home' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', view: 'chat', badge: unreadMessages },
    { id: 'notifications', icon: Bell, label: 'Notifications', view: 'notifications', badge: unreadNotifications },
  ];

  // Creator-only navigation item
  const creatorNavItem: NavItem | null = isCreator
    ? { id: 'creator-studio', icon: BarChart3, label: 'Creator Studio', view: 'creator-studio' }
    : null;

  // Events navigation item (coming soon)
  const eventsNavItem: NavItem = {
    id: 'events',
    icon: Calendar,
    label: 'Events'
  };

  const isActive = (item: NavItem) => {
    return item.view === currentActiveView;
  };

  const handleCreatorClick = (creatorId: string) => {
    if (onCreatorClick) {
      onCreatorClick(creatorId);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-16 flex-col items-center py-4 border-r border-border/50 bg-card/50 backdrop-blur-xl',
          className
        )}
        initial={{ x: -64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/home" prefetch={true}>
              <motion.div
                className="mb-6 flex items-center justify-center w-10 h-10 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
<<<<<<< Updated upstream
                <Image
                  src="/logo/logo-small.png"
                  alt="MeroCircle"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
=======
                <Logo className="w-6 h-6 text-primary object-contain"/>
>>>>>>> Stashed changes
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>MeroCircle</p>
          </TooltipContent>
        </Tooltip>

        {/* Main Navigation */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div>
                  <NavIcon
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item)}
                    badge={item.badge}
                    href={item.view ? getRoute(item.view) : undefined}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Creator Studio - Only for creators */}
          {creatorNavItem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <NavIcon
                    icon={creatorNavItem.icon}
                    label={creatorNavItem.label}
                    isActive={isActive(creatorNavItem)}
                    href={creatorNavItem.view ? getRoute(creatorNavItem.view) : undefined}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{creatorNavItem.label}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Events - Coming Soon */}
          {creatorNavItem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <NavIcon
                    icon={eventsNavItem.icon}
                    label={eventsNavItem.label}
                    badgeText="Soon"
                    disabled={true}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{eventsNavItem.label} - Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          )}
        </nav>

        {/* Divider */}
        <div className="my-4 w-8 h-px bg-border" />

        {/* Favorite Creators */}
        {favoriteCreators.length > 0 && (
          <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto scrollbar-hide">
            {favoriteCreators.slice(0, 5).map((creator) => (
              <Tooltip key={creator.id}>
                <TooltipTrigger asChild>
                  {onCreatorClick ? (
                    <motion.button
                      onClick={() => handleCreatorClick(creator.id)}
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar className="w-9 h-9 ring-2 ring-background">
                        <AvatarImage src={creator.photo_url || undefined} alt={creator.display_name} />
                        <AvatarFallback className="text-xs">
                          {creator.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                    </motion.button>
                  ) : (
                    <Link href={`/creator/${creator.id}`} prefetch={true}>
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar className="w-9 h-9 ring-2 ring-background">
                          <AvatarImage src={creator.photo_url || undefined} alt={creator.display_name} />
                          <AvatarFallback className="text-xs">
                            {creator.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                      </motion.div>
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>@{creator.display_name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {favoriteCreators.length > 5 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground text-xs font-medium"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    +{favoriteCreators.length - 5}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{favoriteCreators.length - 5} more creators</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-3 mt-auto">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {theme === 'dark' ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <NavIcon
                  icon={Settings}
                  label="Settings"
                  isActive={currentActiveView === 'settings'}
                  href="/settings"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/profile" prefetch={true}>
                <motion.div
                  className={cn(
                    "relative rounded-xl p-0.5",
                    currentActiveView === 'profile' && "bg-gradient-to-br from-primary to-pink-500"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className={cn(
                    "w-10 h-10",
                    currentActiveView === 'profile' ? "ring-2 ring-background" : "ring-2 ring-primary/20"
                  )}>
                    <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                    <AvatarFallback>
                      {user?.display_name?.slice(0, 2).toUpperCase() || 'ME'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Your Profile</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
