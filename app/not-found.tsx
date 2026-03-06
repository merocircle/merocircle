'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { PageLayout } from '@/components/common/PageLayout';

export default function NotFound() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-linear-to-b from-background to-muted/20 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center border-border/50 shadow-xl backdrop-blur-sm bg-background/95">
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mb-4"
            >
              <div className="w-32 h-32 mx-auto mb-2 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </motion.div>

            {/* 404 */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4"
            >
              404
            </motion.h1>

            {/* Page Not Found */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-semibold text-foreground mb-3"
            >
              Page Not Found
            </motion.h2>

            {/* Some text here */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8"
            >
              Oops! The page you're looking for doesn't exist.
            </motion.p>

            {/* Go Back Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 justify-center"
            >
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              
              <Button asChild className="gap-2">
                <Link href="/home">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
