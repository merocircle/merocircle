"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Heart, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Check,
  ArrowRight,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const handleRoleSelection = (role: 'supporter' | 'creator') => {
    if (role === 'supporter') {
      router.push('/auth');
    } else {
      router.push('/signup/creator');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-10 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0">
        <div className="w-full max-w-6xl mx-auto flex h-14 sm:h-16 items-center justify-between gap-3 px-4 sm:px-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink">
            <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <span className="text-lg sm:text-xl font-bold text-foreground truncate">MeroCircle</span>
          </Link>
          <Link href="/" className="flex-shrink-0">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl min-w-0"
        >
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Join MeroCircle
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8">
              Choose how you want to be part of Nepal&apos;s creative community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            {/* Supporter Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-4 sm:p-6 md:p-8 h-full border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group min-w-0"
                onClick={() => handleRoleSelection('supporter')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                    I&apos;m a Supporter
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                    Support your favorite creators and access exclusive content
                  </p>
                  <div className="space-y-3 text-left mb-6 sm:mb-8">
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Support creators with donations
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Access exclusive content and perks
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Join creator communities
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Get supporter rewards and recognition
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center">
                      Sign up as Supporter
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Creator Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-4 sm:p-6 md:p-8 h-full border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group min-w-0"
                onClick={() => handleRoleSelection('creator')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                    I&apos;m a Creator
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                    Share your creativity and build a community of supporters
                  </p>
                  <div className="space-y-3 text-left mb-6 sm:mb-8">
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Build your creator profile
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Receive support from fans
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Monetize your content
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Track earnings in NPR
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center">
                      Sign up as Creator
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-muted-foreground/80">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 