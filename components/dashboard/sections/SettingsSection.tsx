'use client';

import { memo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Users,
  Receipt,
  CreditCard,
  Crown,
  LogOut,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react';
import SubscriptionsManagement from '@/components/settings/SubscriptionsManagement';
import EmailNotificationPreferences from '@/components/settings/EmailNotificationPreferences';
import BillingHistory from '@/components/settings/BillingHistory';
import PaymentMethods from '@/components/settings/PaymentMethods';
import { cn, getValidAvatarUrl } from '@/lib/utils';

type SettingsTab = 'notifications' | 'memberships' | 'billing' | 'payment-methods';

const tabs = [
  { id: 'notifications' as SettingsTab, label: 'Email & Notifications', icon: Mail, description: 'Manage your email preferences' },
  { id: 'memberships' as SettingsTab, label: 'Memberships', icon: Users, description: 'Manage your active memberships' },
  { id: 'billing' as SettingsTab, label: 'Billing History', icon: Receipt, description: 'View past transactions' },
  { id: 'payment-methods' as SettingsTab, label: 'Payment Methods', icon: CreditCard, description: 'Manage your payment options' },
];

const SettingsSection = memo(function SettingsSection() {
  const { user, userProfile, isCreator, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            {/* User avatar */}
            <Avatar className="w-12 h-12 border-2 border-border/50">
              <AvatarImage src={getValidAvatarUrl(userProfile?.photo_url)} alt={userProfile?.display_name || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {userProfile?.display_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground truncate">
                  Settings
                </h1>
                {isCreator && (
                  <Badge variant="default" className="bg-primary text-xs px-2 py-0.5">
                    <Crown className="w-3 h-3 mr-1" />
                    Creator
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email || 'Manage your account'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-primary')} />
                    <span className="flex-1 truncate">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}

              <Separator className="my-3" />

              {/* Sign out in sidebar */}
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </nav>

            {/* Account info card */}
            <Card className="mt-6 p-4 border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Shield className="w-3 h-3" />
                <span>Account Security</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your account is secured with Google authentication. Manage your Google account settings to update your password or security options.
              </p>
            </Card>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {user?.email && (
                  <Card className="p-4 border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Account email</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </Card>
                )}
                <EmailNotificationPreferences />
              </div>
            )}

            {activeTab === 'memberships' && (
              <SubscriptionsManagement />
            )}

            {activeTab === 'billing' && (
              <BillingHistory />
            )}

            {activeTab === 'payment-methods' && (
              <PaymentMethods />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SettingsSection;
