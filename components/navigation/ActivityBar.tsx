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
  MessageCircleHeart,
  Calendar,
  PanelRight
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  className,
  isExpanded = false,
  onToggleExpand
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
      case 'events': return '/events';
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
    if (pathname === '/events') return 'events';
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

  const eventsNavItem: NavItem = { id: 'events', icon: Calendar, label: 'Events', view: 'events' };

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
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col py-4 border-r border-border/40 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out',
          isExpanded ? 'items-start w-[240px] px-4' : 'items-center w-[68px] px-2',
          className
        )}
      >
        {/* Logo and Toggle */}
        <div className={cn(
          'flex items-center gap-3 mb-5',
          isExpanded ? 'flex-row w-full gap-0.5' : 'flex-col'
        )}>
          <Link href="/home" prefetch={true}>
            <motion.div
              className="flex items-center justify-center w-10 h-10 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="w-6 h-6 text-primary object-contain"/>
            </motion.div>
          </Link>
          
          {isExpanded && (
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-foreground"
              >
                MeroCircle
              </motion.span>
              <span className="beta-neon-global text-[8px] font-bold tracking-[0.15em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 select-none ml-0.5">
                BETA
              </span>
            </div>
          )}
          
          {!isExpanded && (
            <span className="beta-neon-global text-[8px] font-bold tracking-[0.15em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 mb-3 select-none">
              BETA
            </span>
          )}
          
          {/* Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleExpand}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                  isExpanded 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20 ml-2' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PanelRight size={16} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side={isExpanded ? 'top' : 'right'} sideOffset={8}>
              <p>{isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Navigation */}
        <nav className={cn(
          'flex gap-1',
          isExpanded ? 'flex-col items-stretch w-full' : 'flex-col items-center'
        )}>
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
                    isExpanded={isExpanded}
                    className={isExpanded ? 'w-full' : ''}
                  />
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>{item.label}</p>
                </TooltipContent>
              )}
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
                    isExpanded={isExpanded}
                    className={isExpanded ? 'w-full' : ''}
                  />
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>{creatorNavItem.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Events */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <NavIcon
                  icon={eventsNavItem.icon}
                  label={eventsNavItem.label}
                  isActive={isActive(eventsNavItem)}
                  href={eventsNavItem.view ? getRoute(eventsNavItem.view) : undefined}
                  isExpanded={isExpanded}
                  className={isExpanded ? 'w-full' : ''}
                />
              </div>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8}>
                <p>{eventsNavItem.label}</p>
              </TooltipContent>
            )}
          </Tooltip>

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
                    isExpanded={isExpanded}
                    className={isExpanded ? 'w-full' : ''}
                  />
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>{adminNavItem.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </nav>

        {/* Divider */}
        <div className="my-3 w-full h-px bg-border/60" />

        {/* Favorite Creators */}
        {favoriteCreators.length > 0 && (
          <div className={cn(
            'flex gap-1.5 overflow-y-auto scrollbar-hide max-h-[calc(100vh-400px)]',
            isExpanded ? 'flex-col px-0 w-full' : 'flex-col items-center'
          )}>
            {favoriteCreators.slice(0, 5).map((creator) => (
              <Tooltip key={creator.id}>
                <TooltipTrigger asChild>
                  {onCreatorClick ? (
                    <motion.button
                      onClick={() => handleCreatorClick(creator.id)}
                      className={cn(
                        "relative flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
                        isExpanded ? 'w-full' : ''
                      )}
                      whileHover={{ scale: isExpanded ? 1 : 1.08 }}
                      whileTap={{ scale: isExpanded ? 0.98 : 0.95 }}
                    >
                      <Avatar className="w-9 h-9 ring-1.5 ring-border/40 hover:ring-primary/40 transition-all shrink-0">
                        <AvatarImage src={getValidAvatarUrl(creator.photo_url)} alt={creator.display_name} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {creator.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isExpanded && (
                        <span className="text-sm font-medium text-muted-foreground truncate">
                          {creator.display_name}
                        </span>
                      )}
                    </motion.button>
                  ) : (
                    <Link href={`/creator/${creator.vanity_username || creator.id}`} prefetch={true}>
                      <motion.div
                        className={cn(
                          "relative flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
                          isExpanded ? 'w-full' : ''
                        )}
                        whileHover={{ scale: isExpanded ? 1 : 1.08 }}
                        whileTap={{ scale: isExpanded ? 0.98 : 0.95 }}
                      >
                        <Avatar className="w-9 h-9 ring-1.5 ring-border/40 hover:ring-primary/40 transition-all shrink-0">
                          <AvatarImage src={getValidAvatarUrl(creator.photo_url)} alt={creator.display_name} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {creator.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isExpanded && (
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {creator.display_name}
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  )}
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" sideOffset={8}>
                    <p>{creator.display_name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
            {favoriteCreators.length > 5 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={cn(
                      "flex items-center justify-center gap-3 p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors",
                      isExpanded ? 'w-full justify-start' : 'w-9 h-9'
                    )}
                    whileHover={{ scale: isExpanded ? 1 : 1.08 }}
                    whileTap={{ scale: isExpanded ? 0.98 : 0.95 }}
                  >
                    <span className="text-sm font-semibold">
                      +{favoriteCreators.length - 5}
                    </span>
                    {isExpanded && (
                      <span className="text-sm text-muted-foreground">
                        more creators
                      </span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" sideOffset={8}>
                    <p>{favoriteCreators.length - 5} more</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />
        <div className="my-3 w-full h-px bg-border/60" />

        {/* Bottom Section */}
        <div className={cn(
          'flex flex-col gap-1.5 py-2',
          isExpanded ? 'w-full' : 'items-center'
        )}>
          {/* Feedback */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setShowFeedback(true)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors',
                  isExpanded ? 'w-full justify-start' : 'w-10 h-10'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircleHeart size={18} className="shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium">Quick feedback</span>
                )}
              </motion.button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8}>
                <p>Quick feedback</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={toggleTheme}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
                  isExpanded ? 'w-full justify-start' : 'w-10 h-10'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="shrink-0">
                  {!mounted ? <Monitor size={18} /> : theme === 'system' ? <Monitor size={18} /> : theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium">
                    {!mounted ? 'Theme' : theme === 'system' ? 'System Theme' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                )}
              </motion.button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8}>
                <p>{!mounted ? 'Theme' : theme === 'system' ? 'System Theme' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              </TooltipContent>
            )}
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
                  isExpanded={isExpanded}
                  className={isExpanded ? 'w-full' : ''}
                />
              </div>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8}>
                <p>Settings</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isCreator && creatorProfile?.vanity_username ? `/creator/${creatorProfile.vanity_username}` : '/profile'} prefetch={true}>
                <motion.div
                  className={cn(
                    "relative flex items-center gap-3 p-2 rounded-lg transition-colors",
                    currentActiveView === 'profile' && "bg-primary/10 text-primary",
                    isExpanded ? 'w-full' : ''
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className={cn(
                    "w-9 h-9 shrink-0",
                    currentActiveView === 'profile' && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}>
                    <AvatarImage src={getValidAvatarUrl(user?.photo_url)} alt={user?.display_name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {user?.display_name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  {isExpanded && (
                    <span className={cn(
                      "text-sm font-medium text-muted-foreground truncate",
                      currentActiveView === 'profile' && "text-primary"
                    )}>
                      {user?.display_name || 'Profile'}
                    </span>
                  )}
                </motion.div>
              </Link>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8}>
                <p>Profile</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>

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
