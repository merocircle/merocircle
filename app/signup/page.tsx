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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="relative z-10 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold">MeroCircle</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Join MeroCircle
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Choose how you want to be part of Nepal's creative community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Supporter Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 h-full border-2 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                onClick={() => handleRoleSelection('supporter')}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    I'm a Supporter
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Support your favorite creators and access exclusive content
                  </p>
                  
                  <div className="space-y-3 text-left mb-8">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Support creators with donations
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Access exclusive content and perks
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Join creator communities
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Get supporter rewards and recognition
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white group-hover:scale-105 transition-transform duration-300">
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
              <Card className="p-8 h-full border-2 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                onClick={() => handleRoleSelection('creator')}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    I'm a Creator
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Share your creativity and build a community of supporters
                  </p>
                  
                  <div className="space-y-3 text-left mb-8">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Build your creator profile
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Receive support from fans
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Monetize your content
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Track earnings in NPR
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group-hover:scale-105 transition-transform duration-300">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 