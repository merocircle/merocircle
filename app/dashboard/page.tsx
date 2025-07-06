"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  User, 
  Heart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Settings,
  PlusCircle,
  BarChart3,
  MessageCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function DashboardPage() {
  const { user, userProfile, isAuthenticated, isCreator, loading } = useAuth();
  const router = useRouter();

  // Redirect based on authentication and role
  React.useEffect(() => {
    if (!loading) {
      console.log('Dashboard redirect logic:', { 
        isAuthenticated, 
        userProfile, 
        isCreator,
        userRole: userProfile?.role 
      });
      
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        router.push('/login');
      } else if (userProfile) {
        // Redirect to role-specific dashboard
        // Database roles: 'user' = supporter, 'creator' = creator
        if (userProfile.role === 'creator') {
          console.log('User is creator, redirecting to creator dashboard');
          router.push('/dashboard/creator');
        } else if (userProfile.role === 'user') {
          console.log('User is supporter (role: user), redirecting to supporter dashboard');
          router.push('/dashboard/supporter');
        } else {
          console.log('Unknown role:', userProfile.role, 'defaulting to supporter dashboard');
          router.push('/dashboard/supporter');
        }
      } else {
        console.log('No user profile found yet, waiting...');
      }
    }
  }, [loading, isAuthenticated, userProfile, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Setting up your dashboard...</p>
      </div>
    </div>
  );
} 