'use client';

import { memo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Users, Receipt, CreditCard, Crown, LogOut } from 'lucide-react';
import SubscriptionsManagement from '@/components/settings/SubscriptionsManagement';
import EmailNotificationPreferences from '@/components/settings/EmailNotificationPreferences';
import BillingHistory from '@/components/settings/BillingHistory';
import PaymentMethods from '@/components/settings/PaymentMethods';

const SettingsSection = memo(function SettingsSection() {
  const { user, userProfile, isCreator, signOut } = useAuth();

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account, notifications, memberships, and billing
              </p>
            </div>
            {isCreator && (
              <Badge variant="default" className="bg-primary">
                <Crown className="w-3 h-3 mr-1" />
                Creator
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="notifications" className="gap-2">
              <Mail className="w-4 h-4" />
              <span>Email & Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="memberships" className="gap-2">
              <Users className="w-4 h-4" />
              <span>Manage Memberships</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="w-4 h-4" />
              <span>Billing History</span>
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Payment Methods</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {user?.email && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Account email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </Card>
            )}
            <EmailNotificationPreferences />
          </TabsContent>

          <TabsContent value="memberships">
            <SubscriptionsManagement />
          </TabsContent>

          <TabsContent value="billing">
            <BillingHistory />
          </TabsContent>

          <TabsContent value="payment-methods">
            <PaymentMethods />
          </TabsContent>
        </Tabs>

        <Card className="p-6 mt-6 border-destructive/20">
          <h2 className="text-lg font-semibold mb-2 text-destructive">Sign Out</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button variant="destructive" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
});

export default SettingsSection;
