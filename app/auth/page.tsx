"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import './auth-theme.css';

// Fallback creator data in case API fails
const fallbackCreators = [
  {
    name: "Aayush Sharma",
    category: "Tech Creator",
    bio: "",
    supporters: 0,
    profileImage: "/auth-page/tech_front.jpeg",
    coverImage: "/auth-page/tech_back.png",
    vanityUsername: null,
  },
  {
    name: "Nishar Miya",
    category: "Content Creator",
    bio: "",
    supporters: 0,
    profileImage: "/auth-page/creator_profile.jpg",
    coverImage: "/auth-page/creator_back.jpg",
    vanityUsername: null,
  },
  {
    name: "Priya Thapa",
    category: "Artist",
    bio: "",
    supporters: 0,
    profileImage: "/auth-page/musician_profile.jpg",
    coverImage: "/auth-page/musician_back.jpeg",
    vanityUsername: null,
  }
];

type CreatorCard = {
  name: string;
  category: string;
  bio: string;
  supporters: number;
  profileImage: string | null;
  coverImage: string | null;
  vanityUsername: string | null;
};

function formatSupporters(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K supporters`;
  return `${count} supporter${count !== 1 ? 's' : ''}`;
}

function AuthPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [creatorShowcase, setCreatorShowcase] = useState<CreatorCard[]>([]);
  const [creatorsLoaded, setCreatorsLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { userProfile, loading: authLoading } = useAuth();

  // Fetch top creators from API
  useEffect(() => {
    fetch('/api/public/top-creators')
      .then((res) => res.json())
      .then((data) => {
        if (data.creators && data.creators.length >= 3) {
          setCreatorShowcase(data.creators);
        } else {
          setCreatorShowcase(fallbackCreators);
        }
      })
      .catch(() => {
        setCreatorShowcase(fallbackCreators);
      })
      .finally(() => setCreatorsLoaded(true));
  }, []);
  
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
    if (isDragging || creatorShowcase.length === 0) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % creatorShowcase.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isDragging, creatorShowcase.length]);

  // Card transition animation
  useEffect(() => {
    if (!cardsRef.current || isDragging || creatorShowcase.length === 0) return;

    const cards = document.querySelectorAll('.creator-card-item');
    const totalCards = creatorShowcase.length;
    
    cards.forEach((card, index) => {
      let distance = index - currentCard;
      
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
  }, [currentCard, dragOffset, isDragging, creatorShowcase.length]);

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

  // Use only auth context loading so CI timeout can unblock (context sets loading false after 6s in E2E)
  if (authLoading) {
    return (
      <div className="auth-theme min-h-screen flex items-center justify-center" style={{ background: 'var(--auth-bg, #faf8f6)' }}>
        <Loader2 className="h-6 w-6 animate-spin text-[#6b5d56]" />
      </div>
    );
  }

  return (
    <div className="auth-theme min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Auth Form */}
      <div
        ref={leftSideRef}
        className="auth-left w-full lg:w-1/2 min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
      >
        <div className="w-full max-w-md space-y-6 sm:space-y-8 overflow-hidden">
          {/* Logo + Beta */}
          <div className="auth-logo flex flex-col items-center gap-2">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/logo-light.png"
                alt="MeroCircle"
                width={96}
                height={96}
                className="object-contain"
              />
            </Link>
            <span className="beta-neon beta-float text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full">
              BETA
            </span>
          </div>

          {/* Motto (mobile: center of page feel) */}
          <p className="auth-motto text-center text-sm font-semibold text-[var(--auth-text-muted)] max-w-xs mx-auto lg:max-w-none lg:text-left lg:mx-0">
            Your favorite creator now more closer than ever.
          </p>

          {/* Title */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="auth-title text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Sign in
            </h1>
            <p className="auth-description text-sm sm:text-base lg:text-lg">
              Create an account to start supporting creators and join exclusive communities
            </p>
          </div>

          {/* Free Beta Banner */}
          <div className="rounded-xl p-3 bg-[var(--auth-accent-soft)] border border-[var(--auth-accent)]/30 text-center">
            <p className="text-sm font-semibold text-[var(--auth-text)]">
              Everything is free to test for now
            </p>
            <p className="text-xs text-[var(--auth-text-muted)] mt-0.5">
              We are in beta. Explore all features at no cost.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error rounded-xl p-4 flex items-start gap-3 border">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <div className="auth-button space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 font-semibold text-base rounded-2xl bg-[#1a1a1a] hover:bg-[#111] text-white border-0 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="auth-footer pt-6">
            <p className="auth-footer-text text-sm text-center">
              All users start as supporters. You can become a creator anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Sliding Creator Cards */}
      <div className="auth-right hidden lg:flex w-1/2 relative overflow-hidden">

        {/* Cards Container */}
        <div className="relative w-full flex items-center justify-center p-12">
          {!creatorsLoaded || creatorShowcase.length === 0 ? (
            <div className="flex items-center justify-center h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-white/40" />
            </div>
          ) : (
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
                    {/* Background / Cover Image */}
                    {creator.coverImage ? (
                      <Image
                        src={creator.coverImage}
                        alt={creator.name}
                        fill
                        className="object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-pink-500/30 to-purple-600/40" />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-8">
                      {creator.profileImage ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white/40 shadow-xl">
                          <Image
                            src={creator.profileImage}
                            alt={creator.name}
                            fill
                            className="object-cover"
                            draggable={false}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full mb-4 border-4 border-white/40 shadow-xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                          {creator.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">{creator.name}</h3>
                      <p className="text-white/80 text-sm drop-shadow-md mb-2">{creator.category}</p>
                      {creator.bio && (
                        <p className="text-white/60 text-xs leading-relaxed line-clamp-2 max-w-[220px]">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatSupporters(creator.supporters)}</span>
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
                    index === currentCard ? 'w-8 auth-dot' : 'w-2 auth-dot-inactive'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Top Beta Neon */}
        <div className="absolute top-6 right-6 z-20">
          <span className="beta-neon-bright beta-float text-[11px] font-bold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
            BETA
          </span>
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
