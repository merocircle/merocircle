'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  Trash2,
  AlertTriangle,
  Loader2,
  MessageCircleHeart,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import SubscriptionsManagement from '@/components/settings/SubscriptionsManagement';
import EmailNotificationPreferences from '@/components/settings/EmailNotificationPreferences';
import BillingHistory from '@/components/settings/BillingHistory';
import PaymentMethods from '@/components/settings/PaymentMethods';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import { cn, getValidAvatarUrl } from '@/lib/utils';

type SettingsTab = 'notifications' | 'memberships' | 'billing' | 'payment-methods';

interface NavigationProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  signOut: () => void;
  userProfile: any;
}

const MobileNavigation = ({ activeTab, setActiveTab, showFeedback, setShowFeedback, signOut, userProfile }: NavigationProps) => (
  <nav className="p-4 space-y-1">
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
          <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
          <span className="flex-1 truncate">{tab.label}</span>
          {isActive && <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>
      );
    })}

    <Separator className="my-3" />

    {/* Feedback */}
    <button
      onClick={() => {
        setShowFeedback(true);
      }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    >
      <MessageCircleHeart className="w-4 h-4 shrink-0" />
      <span>Give feedback</span>
    </button>

    <Separator className="my-3" />

    <button
      onClick={signOut}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm text-destructive hover:bg-destructive/10"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      <span>Sign Out</span>
    </button>

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
  </nav>
);

const DesktopNavigation = ({ activeTab, setActiveTab, showFeedback, setShowFeedback, signOut, userProfile }: NavigationProps) => (
  <>
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
            <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
            <span className="flex-1 truncate">{tab.label}</span>
            {isActive && <ChevronRight className="w-4 h-4 shrink-0" />}
          </button>
        );
      })}

      <Separator className="my-3" />

      {/* Sign out in sidebar */}
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 shrink-0" />
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
  </>
);

const tabs = [
  { id: 'notifications' as SettingsTab, label: 'Email & Notifications', icon: Mail, description: 'Manage your email preferences' },
  { id: 'memberships' as SettingsTab, label: 'Memberships', icon: Users, description: 'Manage your active memberships' },
  { id: 'billing' as SettingsTab, label: 'Billing History', icon: Receipt, description: 'View past transactions' },
  { id: 'payment-methods' as SettingsTab, label: 'Payment Methods', icon: CreditCard, description: 'Manage your payment options' },
];

const SettingsSection = memo(function SettingsSection() {
  const { user, userProfile, isCreator, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            {/* Back button - only visible on mobile */}
            <button
              onClick={handleBack}
              className="lg:hidden p-2 rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            
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

            {/* Mobile menu button - moved to top right */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="lg" className="lg:hidden shrink-0 h-12 w-12">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-left">Settings</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <MobileNavigation 
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                      setActiveTab(tab);
                      setMobileMenuOpen(false);
                    }}
                    showFeedback={showFeedback}
                    setShowFeedback={setShowFeedback}
                    signOut={signOut}
                    userProfile={userProfile}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop sidebar navigation - hidden on mobile */}
          <div className="hidden lg:block lg:w-64 shrink-0">
            <DesktopNavigation 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showFeedback={showFeedback}
              setShowFeedback={setShowFeedback}
              signOut={signOut}
              userProfile={userProfile}
            />
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

            {activeTab === 'billing' && (
              <div className="mt-8 pt-6 border-t border-border/30">
                <Card className="p-5 border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Permanently delete your account and all associated data including posts, memberships, and transactions. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete My Account
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 rounded-xl border border-destructive/30 bg-background">
                      <p className="text-xs text-muted-foreground">
                        Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-destructive focus:border-destructive outline-none"
                      />
                      {deleteError && (
                        <p className="text-xs text-destructive">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(null); }}
                          className="rounded-full"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteConfirmText !== 'DELETE' || deleting}
                          onClick={async () => {
                            setDeleting(true);
                            setDeleteError(null);
                            try {
                              const res = await fetch('/api/account/delete', { method: 'DELETE' });
                              if (!res.ok) {
                                const data = await res.json().catch(() => ({}));
                                throw new Error(data.error || 'Failed to delete account');
                              }
                              signOut();
                            } catch (e) {
                              setDeleteError(e instanceof Error ? e.message : 'Something went wrong');
                              setDeleting(false);
                            }
                          }}
                          className="rounded-full gap-1.5"
                        >
                          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          {deleting ? 'Deleting...' : 'Permanently Delete'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <FeedbackSheet
        open={showFeedback}
        onOpenChange={setShowFeedback}
        userId={user?.id}
        displayName={userProfile?.display_name}
        isCreator={isCreator}
      />
    </div>
  );
});

export default SettingsSection;
