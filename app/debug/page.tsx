"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, user, userProfile } = useAuth();

  const testGoogleAuth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing Google OAuth...');
      const { data, error } = await signInWithGoogle();
      
      console.log('OAuth result:', { data, error });
      setResult({ data, error, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('OAuth test error:', error);
      setResult({ error: error.message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setResult({ authCheck: data, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({ error: error.message, timestamp: new Date().toISOString() });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Page</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>User Profile:</strong> {userProfile ? `${userProfile.role} - ${userProfile.display_name}` : 'No profile'}</p>
              <p><strong>Environment:</strong></p>
              <ul className="ml-4 list-disc">
                <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Google OAuth</h2>
            <div className="space-y-4">
              <Button 
                onClick={testGoogleAuth} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Google OAuth'}
              </Button>
              
              <Button 
                onClick={checkAuthStatus} 
                variant="outline"
                className="w-full"
              >
                Check Auth Status
              </Button>
            </div>
          </Card>

          {result && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Result</h2>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 