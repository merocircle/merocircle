'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, DollarSign, MessageSquare } from 'lucide-react';
import { OnboardingTab } from './OnboardingTab';
import { TransactionsTab } from './TransactionsTab';
import { FeedbackTab } from './FeedbackTab';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'transactions' | 'feedback'>('onboarding');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage creators and track transactions</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding">
          <OnboardingTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
