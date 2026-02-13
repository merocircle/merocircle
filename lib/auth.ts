import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/lib/supabase/server";

// Validate required env vars at load time
const requiredEnvVars = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;
const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error("[NextAuth] Missing required env vars:", missing.join(", "));
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
          
          // 🚀 SENIOR DEV: Send welcome email immediately (simple & reliable)
          try {
            // Import dynamically to avoid blocking
            const { sendWelcomeEmail } = await import('@/lib/email');
            
            // Send in background (fire & forget)
            sendWelcomeEmail({
              userEmail: user.email,
              userName: user.name || user.email.split('@')[0],
              userRole: 'supporter',
            }).then(success => {
              if (success) {
                console.log('✅ Welcome email sent to:', user.email);
              } else {
                console.warn('⚠️ Welcome email failed (non-critical):', user.email);
              }
            }).catch(err => {
              console.warn('⚠️ Welcome email error (non-critical):', err.message);
            });
          } catch (emailError) {
            // Never block signup if email fails
            console.error('Failed to send welcome email:', emailError);
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
