'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  MessageCircle,
  Bell,
  BarChart3,
  Settings,
  User,
  Sun,
  Moon,
  Monitor,
  Shield,
  MessageCircleHeart
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavIcon } from './NavIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getValidAvatarUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { type DashboardView } from '@/contexts/dashboard-context';
import { isAdmin } from '@/lib/admin-middleware';
import { Logo } from '@/components/ui/logo';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import { PeriodicFeedbackDialog } from '@/components/feedback/PeriodicFeedbackDialog';

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
    vanity_username?: string | null;
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
  const { isCreator, creatorProfile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isAdminUser = user?.id ? isAdmin(user.id) : false;
  const [mounted, setMounted] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    // Cycle: system -> light -> dark -> system
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

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

  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/notifications') return 'notifications';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/profile') return 'profile';
    if (isCreator && creatorProfile?.vanity_username && pathname === `/creator/${creatorProfile.vanity_username}`) return 'profile';
    if (pathname === '/creator-studio') return 'creator-studio';
    return 'home';
  };

  const currentActiveView = getActiveViewFromPath();

  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', view: 'home' },
    { id: 'explore', icon: Compass, label: 'Explore', view: 'explore' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', view: 'chat', badge: unreadMessages },
    { id: 'notifications', icon: Bell, label: 'Notifications', view: 'notifications', badge: unreadNotifications },
  ];

  const creatorNavItem: NavItem | null = isCreator
    ? { id: 'creator-studio', icon: BarChart3, label: 'Creator Studio', view: 'creator-studio' }
    : null;

  const adminNavItem: NavItem | null = isAdminUser
    ? { id: 'admin', icon: Shield, label: 'Admin' }
    : null;

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
          'fixed left-0 top-0 z-50 flex h-screen w-[68px] flex-col items-center py-4 border-r border-border/40 bg-card/80 backdrop-blur-xl',
          className
        )}
        initial={{ x: -68, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/home" prefetch={true}>
              <motion.div
                className="mb-5 flex items-center justify-center w-10 h-10 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Logo className="w-6 h-6 text-primary object-contain"/>
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>MeroCircle</p>
          </TooltipContent>
        </Tooltip>

        {/* Beta Badge */}
        <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3 select-none">
          BETA
        </span>

        {/* Main Navigation */}
        <nav className="flex flex-col items-center gap-1">
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
              <TooltipContent side="right" sideOffset={8}>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Creator Studio */}
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
              <TooltipContent side="right" sideOffset={8}>
                <p>{creatorNavItem.label}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Admin */}
          {adminNavItem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <NavIcon
                    icon={adminNavItem.icon}
                    label={adminNavItem.label}
                    isActive={pathname === '/admin'}
                    href="/admin"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>{adminNavItem.label}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </nav>

        {/* Divider */}
        <div className="my-3 w-7 h-px bg-border/60" />

        {/* Favorite Creators */}
        {favoriteCreators.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 flex-1 overflow-y-auto scrollbar-hide px-1">
            {favoriteCreators.slice(0, 5).map((creator) => (
              <Tooltip key={creator.id}>
                <TooltipTrigger asChild>
                  {onCreatorClick ? (
                    <motion.button
                      onClick={() => handleCreatorClick(creator.id)}
                      className="relative"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar className="w-9 h-9 ring-1.5 ring-border/40 hover:ring-primary/40 transition-all">
                        <AvatarImage src={getValidAvatarUrl(creator.photo_url)} alt={creator.display_name} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {creator.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.button>
                  ) : (
                    <Link href={`/creator/${creator.vanity_username || creator.id}`} prefetch={true}>
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar className="w-9 h-9 ring-1.5 ring-border/40 hover:ring-primary/40 transition-all">
                          <AvatarImage src={getValidAvatarUrl(creator.photo_url)} alt={creator.display_name} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {creator.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>{creator.display_name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {favoriteCreators.length > 5 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 text-muted-foreground text-[10px] font-semibold hover:bg-muted transition-colors"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    +{favoriteCreators.length - 5}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>{favoriteCreators.length - 5} more</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-1.5 mt-auto">
          {/* Feedback */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setShowFeedback(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircleHeart size={18} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>Quick feedback</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {!mounted ? <Monitor size={18} /> : theme === 'system' ? <Monitor size={18} /> : theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>{!mounted ? 'Theme' : theme === 'system' ? 'System Theme' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
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
            <TooltipContent side="right" sideOffset={8}>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isCreator && creatorProfile?.vanity_username ? `/creator/${creatorProfile.vanity_username}` : '/profile'} prefetch={true}>
                <motion.div
                  className={cn(
                    "relative rounded-full p-0.5 mt-1",
                    currentActiveView === 'profile' && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={getValidAvatarUrl(user?.photo_url)} alt={user?.display_name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {user?.display_name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>

      <FeedbackSheet
        open={showFeedback}
        onOpenChange={setShowFeedback}
        userId={user?.id}
        displayName={user?.display_name}
        isCreator={isCreator}
      />
      <PeriodicFeedbackDialog
        userId={user?.id}
        displayName={user?.display_name}
        isCreator={isCreator}
      />
    </TooltipProvider>
  );
}
