"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    // Only run once
    if (processedRef.current) return;
    processedRef.current = true;

    // Helper function to wait for profile creation
    const waitForProfile = async (maxAttempts = 5): Promise<void> => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          return;
        }

        // Check if this is a creator signup flow
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
              // If profile exists but role needs updating (for creator signup)
              if (isCreatorSignup && profile.role !== 'creator') {
                await supabase
                  .from('users')
                  .update({ role: 'creator' })
                  .eq('id', user.id);
              }
              return; // Profile exists
            }

            // If no profile (PGRST116 = not found), try to create it
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

              // If duplicate (23505), profile was created by trigger - wait and check
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
                return; // Profile exists now
              }
              
              // If no error, profile was created successfully
              if (!createError) {
                return;
              }
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error in profile check attempt:', err);
            // Continue to next attempt
          }
        }
      } catch (err) {
        console.error('Error in waitForProfile:', err);
        // Don't throw - just return, let auth context handle profile creation
      }
    };

    const processCallback = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Auth callback timeout - redirecting anyway');
        router.replace('/dashboard');
      }, 10000); // 10 second timeout

      try {
        // Get params from URL directly
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        // Handle errors
        if (error) {
          clearTimeout(timeoutId);
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        let sessionCreated = false;

        // Handle hash fragment first (if present)
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

        // Handle authorization code
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

        // If session was created, wait for profile (with timeout)
        if (sessionCreated) {
          try {
            await Promise.race([
              waitForProfile(),
              new Promise(resolve => setTimeout(resolve, 3000)) // Max 3 seconds for profile
            ]);
          } catch (err) {
            console.error('Profile wait error:', err);
            // Continue anyway - auth context will handle it
          }
          
          clearTimeout(timeoutId);
          router.replace('/dashboard');
          return;
        }

        // Fallback: if no code/hash, check if already authenticated
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
                }
                return; // Profile exists now
              }
              
              // If no error, profile was created successfully
              if (!createError) {
                return;
              }
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error in profile check attempt:', err);
            // Continue to next attempt
          }
        }
      } catch (err) {
        console.error('Error in waitForProfile:', err);
        // Don't throw - just return, let auth context handle profile creation
      }
    };

    const processCallback = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Auth callback timeout - redirecting anyway');
        router.replace('/dashboard');
      }, 10000); // 10 second timeout

      try {
        // Get params from URL directly
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        // Handle errors
        if (error) {
          clearTimeout(timeoutId);
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        let sessionCreated = false;

        // Handle hash fragment first (if present)
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

        // Handle authorization code
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

        // If session was created, wait for profile (with timeout)
        if (sessionCreated) {
          try {
            await Promise.race([
              waitForProfile(),
              new Promise(resolve => setTimeout(resolve, 3000)) // Max 3 seconds for profile
            ]);
          } catch (err) {
            console.error('Profile wait error:', err);
            // Continue anyway - auth context will handle it
          }
          
          clearTimeout(timeoutId);
          router.replace('/dashboard');
          return;
        }

        // Fallback: if no code/hash, check if already authenticated
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