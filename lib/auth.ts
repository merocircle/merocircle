import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const requiredEnvVars = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;
const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  logger.error('Missing required env vars', 'NEXTAUTH', { missing: missing.join(', ') });
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
      logger.info('SignIn callback triggered', 'NEXTAUTH', { email: user.email });
      
      if (!user.email) {
        logger.error('No email provided in signIn', 'NEXTAUTH');
        return false;
      }

      try {
        const supabase = await createClient();
        
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          logger.error('Error fetching user in signIn', 'NEXTAUTH', { error: fetchError.message });
          return false;
        }

        if (!existingUser) {
          logger.info('Creating new user', 'NEXTAUTH', { email: user.email });
          
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
            logger.error('Error creating user', 'NEXTAUTH', { error: createError.message });
            return false;
          }

          logger.info('New user created', 'NEXTAUTH', { userId: newUser?.id, email: user.email });
          
          try {
            const { sendWelcomeEmail } = await import('@/lib/email');
            sendWelcomeEmail({
              userEmail: user.email,
              userName: user.name || user.email.split('@')[0],
              userRole: 'supporter',
            }).then(success => {
              if (success) {
                logger.info('Welcome email sent', 'NEXTAUTH', { email: user.email });
              } else {
                logger.warn('Welcome email failed (non-critical)', 'NEXTAUTH', { email: user.email });
              }
            }).catch(err => {
              logger.warn('Welcome email error (non-critical)', 'NEXTAUTH', { error: err?.message });
            });
          } catch (emailError) {
            logger.error('Failed to send welcome email', 'NEXTAUTH', {
              error: emailError instanceof Error ? emailError.message : String(emailError),
            });
          }
          
          if (newUser) {
            user.id = newUser.id;
          }
        } else {
          logger.debug('User exists', 'NEXTAUTH', { userId: existingUser.id });
          user.id = existingUser.id;
        }

        return true;
      } catch (error) {
        logger.error('SignIn callback error', 'NEXTAUTH', {
          error: error instanceof Error ? error.message : String(error),
        });
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
            logger.error('Error fetching profile in session', 'NEXTAUTH', { error: profileError.message });
          }

          if (userProfile) {
            session.user.role = userProfile.role;
            session.user.profile = userProfile;
          }
        } catch (error) {
          logger.error('Session callback error', 'NEXTAUTH', {
            error: error instanceof Error ? error.message : String(error),
          });
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
