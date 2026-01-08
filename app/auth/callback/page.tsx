"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const waitForProfile = async (maxAttempts = 5): Promise<void> => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          return;
        }

        const isCreatorSignup = localStorage.getItem('isCreatorSignupFlow') === 'true';
        const defaultRole = isCreatorSignup ? 'creator' : 'user';
        
        if (isCreatorSignup) {
          localStorage.removeItem('isCreatorSignupFlow');
        }

        for (let i = 0; i < maxAttempts; i++) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              if (isCreatorSignup && profile.role !== 'creator') {
                await supabase
                  .from('users')
                  .update({ role: 'creator' })
                  .eq('id', user.id);
              }
              return;
            }

            if (profileError?.code === 'PGRST116' && i === 0) {
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  display_name: user.user_metadata?.display_name || 
                               user.user_metadata?.full_name || 
                               user.user_metadata?.name ||
                               user.email?.split('@')[0] || 
                               'User',
                  photo_url: user.user_metadata?.avatar_url || 
                            user.user_metadata?.picture || 
                            null,
                  role: defaultRole
                });

              if (createError?.code === '23505') {
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: existingProfile } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', user.id)
                  .single();
                
                if (existingProfile && isCreatorSignup && existingProfile.role !== 'creator') {
                  await supabase
                    .from('users')
                    .update({ role: 'creator' })
                    .eq('id', user.id);
                }
                return;
              }
              
              if (!createError) {
                return;
              }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error in profile check attempt:', err);
            // Continue to next attempt
          }
        }
      } catch (err) {
        console.error('Error in waitForProfile:', err);
      }
    };

    const processCallback = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('Auth callback timeout - redirecting anyway');
        router.replace('/dashboard');
      }, 10000);

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          clearTimeout(timeoutId);
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        let sessionCreated = false;

        if (window.location.hash) {
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (!sessionError) {
              sessionCreated = true;
              // Clear hash
              window.history.replaceState(null, '', window.location.pathname);
            } else {
              console.error('Session error from hash:', sessionError);
            }
          }
        }

        if (code && !sessionCreated) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            clearTimeout(timeoutId);
            console.error('Exchange code error:', exchangeError);
            router.replace(`/login?error=${encodeURIComponent(exchangeError.message || 'callback_failed')}`);
            return;
          }

          if (data.session) {
            sessionCreated = true;
          }
        }

        if (sessionCreated) {
          try {
            await Promise.race([
              waitForProfile(),
              new Promise(resolve => setTimeout(resolve, 3000))
            ]);
          } catch (err) {
            console.error('Profile wait error:', err);
          }
          
          clearTimeout(timeoutId);
          router.replace('/dashboard');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=no_session');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Callback error:', err);
        router.replace('/login?error=callback_failed');
      }
    };

    processCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}