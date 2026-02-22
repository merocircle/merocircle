"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && !loading && isAuthenticated) {
      router.replace("/home");
    }
  }, [status, loading, isAuthenticated, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    if (message) {
      setUrlMessage(message);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (status === "loading" || loading || isAuthenticated) {
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
