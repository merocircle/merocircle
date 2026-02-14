"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';

import Logo from "@/components/ui/logo.svg";

// Creator showcase cards data
const creatorShowcase = [
  {
    name: "Aayush Sharma",
    category: "Tech Creator",
    supporters: "2.4K supporters",
    profileImage: "/auth-page/tech_front.jpeg",
    backgroundImage: "/auth-page/tech_back.png"
  },
  {
    name: "Nishar Miya",
    category: "Content Creator",
    supporters: "3.5K supporters",
    profileImage: "/auth-page/creator_profile.jpg",
    backgroundImage: "/auth-page/creator_back.jpg"
  },
  {
    name: "Priya Thapa",
    category: "Artist",
    supporters: "1.8K supporters",
    profileImage: "/auth-page/musician_profile.jpg",
    backgroundImage: "/auth-page/musician_back.jpeg"
  }
];

function AuthPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const { userProfile, loading: authLoading } = useAuth();
  
  const leftSideRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Map NextAuth error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        Configuration: 'Authentication is not configured correctly. Please ensure NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET are set in .env.local.',
        AccessDenied: 'Access denied. You do not have permission to sign in.',
        Verification: 'The sign-in link has expired or has already been used.',
        Default: 'An error occurred during sign in. Please try again.',
      };
      setError(errorMessages[errorParam] || errorParam);
      router.replace('/auth', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (session && userProfile && status === 'authenticated') {
      router.replace('/home');
    }
  }, [session, userProfile, status, router]);

  // Entrance animations
  useEffect(() => {
    if (authLoading) return;

    const ctx = gsap.context(() => {
      gsap.from('.auth-logo', {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });

      gsap.from('.auth-title', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.1,
        ease: 'power2.out'
      });

      gsap.from('.auth-description', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power2.out'
      });

      gsap.from('.auth-button', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out'
      });

      gsap.from('.auth-footer', {
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: 'power2.out'
      });
    });

    return () => ctx.revert();
  }, [authLoading]);

  // Auto-slide cards
  useEffect(() => {
    if (isDragging) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % creatorShowcase.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isDragging]);

  // Card transition animation
  useEffect(() => {
    if (!cardsRef.current || isDragging) return;

    const cards = document.querySelectorAll('.creator-card-item');
    const totalCards = creatorShowcase.length;
    
    cards.forEach((card, index) => {
      // Calculate distance with wrapping for infinite effect
      let distance = index - currentCard;
      
      // Wrap distance to always show closest path
      if (distance > totalCards / 2) {
        distance -= totalCards;
      } else if (distance < -totalCards / 2) {
        distance += totalCards;
      }
      
      const isCenter = distance === 0;
      
      gsap.to(card, {
        x: distance * 320 + dragOffset,
        scale: isCenter ? 1 : 0.85,
        opacity: isCenter ? 1 : 0.5,
        filter: isCenter ? 'blur(0px)' : 'blur(4px)',
        zIndex: isCenter ? 10 : 1,
        duration: 0.6,
        ease: 'power3.out'
      });
    });
  }, [currentCard, dragOffset, isDragging]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    
    if (dragOffset > threshold) {
      setCurrentCard((prev) => (prev - 1 + creatorShowcase.length) % creatorShowcase.length);
    } else if (dragOffset < -threshold) {
      setCurrentCard((prev) => (prev + 1) % creatorShowcase.length);
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signIn('google', { callbackUrl: '/home' });

      if (result?.error) {
        setError(result.error || 'Failed to sign in');
        setLoading(false);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  }, []);

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Auth Form */}
      <div
        ref={leftSideRef}
        className="w-full lg:w-1/2 min-h-[100dvh] bg-white dark:bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="auth-logo flex justify-center">
            <Link href="/" className="inline-block">
              <Logo className="w-24 h-24 text-primary object-contain"/>
            </Link>
          </div>

          {/* Title */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="auth-title text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-foreground tracking-tight">
              Sign in
            </h1>
            <p className="auth-description text-gray-600 dark:text-muted-foreground text-sm sm:text-base lg:text-lg">
              Create an account to start supporting creators and join exclusive communities
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <div className="auth-button space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 font-medium text-base transition-all shadow-sm hover:shadow"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </div>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="auth-footer space-y-6 pt-4">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              By continuing, you agree to MeroCircle's{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                All users start as supporters. You can become a creator anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sliding Creator Cards */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden">

        {/* Cards Container */}
        <div className="relative w-full flex items-center justify-center p-12">
          <div 
            ref={cardsRef}
            className="relative w-full max-w-md h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {creatorShowcase.map((creator, index) => (
              <div
                key={index}
                className="creator-card-item absolute w-72"
                onClick={() => setCurrentCard(index)}
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl transition-all">
                  {/* Image */}
                  <div className="h-80 relative overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src={creator.backgroundImage}
                      alt={creator.name}
                      fill
                      className="object-cover"
                      draggable={false}
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-8">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white/40 shadow-xl">
                        <Image
                          src={creator.profileImage}
                          alt={creator.name}
                          fill
                          className="object-cover"
                          draggable={false}
                        />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{creator.name}</h3>
                      <p className="text-white/90 drop-shadow-md">{creator.category}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{creator.supporters}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination Dots */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2">
              {creatorShowcase.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCard(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentCard ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-8 left-8 right-8 text-center">
          <p className="text-white/90 text-lg font-medium">
            Join 10,000+ supporters making a difference
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
