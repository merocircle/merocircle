"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import "./landing-page.css";
import {
  UrlMessageBanner,
  LandingNav,
  HeroSection,
  CTASection,
  Footer,
} from "@/components/landing";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";

export default function LandingPage() {
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/home");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    if (message) {
      setUrlMessage(message);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Use only auth context loading so CI timeout can unblock (context sets loading false after 6s in E2E)
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#990000] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="landing-page-wrap">
      <div className="landing-page-content">
        <LandingNav />
        <UrlMessageBanner
          message={urlMessage}
          onClose={() => setUrlMessage(null)}
        />
        <HeroSection />
        <SocialProofStrip />
        <ShowcaseSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
