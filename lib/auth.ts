import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback triggered for:', user.email);
      
      if (!user.email) {
        console.error('[NextAuth] No email provided');
        return false;
      }

      try {
        console.log('[NextAuth] Creating client...');
        // Use regular client now that RLS is disabled
        const supabase = await createClient();
        console.log('[NextAuth] Client created successfully');
        
        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          return false;
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          console.log('Creating new user:', user.email);
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email: user.email,
              display_name: user.name || user.email.split('@')[0],
              photo_url: user.image || null,
              role: 'user',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return false;
          }

          console.log('New user created:', newUser?.id);
          
          // 🎯 Queue welcome email for new users
          try {
            await supabase.from('email_queue').insert({
              email_type: 'welcome',
              recipient_email: user.email,
              payload: {
                userId: newUser.id,
                userName: user.name || user.email.split('@')[0],
                userRole: 'supporter',
                userEmail: user.email,
              },
              scheduled_for: new Date().toISOString(),
            });
            
            console.log('✅ Welcome email queued for:', user.email);
            
            // 🚀 NO CRON NEEDED: Trigger processor immediately (fire & forget)
            // This works on free Vercel tier - processes within seconds
            const processorUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/process-queue`;
            fetch(processorUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
                'Content-Type': 'application/json',
              },
            }).catch(err => {
              console.warn('Email processor trigger failed (non-critical):', err.message);
            });
          } catch (emailError) {
            // Don't block signup if email queueing fails
            console.error('Failed to queue welcome email:', emailError);
          }
          
          // Store the new user's ID for the JWT token
          if (newUser) {
            user.id = newUser.id;
          }
        } else {
          console.log('User exists:', existingUser.id);
          // User exists, use their existing ID
          user.id = existingUser.id;
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        
        // Fetch user profile from Supabase
        try {
          const supabase = await createClient();
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*, creator_profiles(*)')
            .eq('id', token.sub!)
            .single();

          if (profileError) {
            console.error('Error fetching profile in session:', profileError);
          }

          if (userProfile) {
            session.user.role = userProfile.role;
            session.user.profile = userProfile;
          }
        } catch (error) {
          console.error('Session callback error:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode to see more logs
};
