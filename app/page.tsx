"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/auth-context";
import {
  UrlMessageBanner,
  HeroSection,
  ProblemSection,
  SolutionSection,
  WaysToSupportSection,
  TrustSection,
  ProcessSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const { status } = useSession();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users immediately - check before rendering landing page
  useEffect(() => {
    if (status !== 'loading' && !loading && isAuthenticated) {
      router.replace('/home');
    }
  }, [status, loading, isAuthenticated, router]);

  useEffect(() => {
    // Check for URL messages
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setUrlMessage(message);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Don't render landing page content if authenticated or still loading
  if (status === 'loading' || loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      
      <UrlMessageBanner 
        message={urlMessage} 
        onClose={() => setUrlMessage(null)} 
      />
      
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <WaysToSupportSection />
      <TrustSection />
      <ProcessSection />
      <CTASection />
      <Footer />
    </div>
  );
}
