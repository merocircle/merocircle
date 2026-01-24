"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, useScroll, useTransform, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Star,
  Coffee,
  Play,
  CheckCircle,
  ArrowDown,
  MessageCircle,
  Clock,
  Sparkles,
  Bookmark,
  Lightbulb,
  Calendar,
  Target,
  Award,
  Search,
  Plug,
} from "lucide-react";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/supabase-auth-context";
import { logger } from "@/lib/logger";
import Image from "next/image";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

// Hero stats data
const heroStats = [
  { value: "5K+", label: "Nepal Creators", icon: Users },
  { value: "₹2M+", label: "Creator Earnings", icon: TrendingUp },
  { value: "50K+", label: "Active Supporters", icon: Heart },
  { value: "99.9%", label: "Uptime", icon: Shield },
];

// Features data
const features = [
  {
    icon: Heart,
    title: "Local Payment Solutions",
    description: "Seamlessly receive payments through eSewa and Khalti - Nepal's most trusted payment gateways.",
  },
  {
    icon: Users,
    title: "Build Your Community",
    description: "Connect with supporters, share exclusive content, and build lasting relationships with your audience.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Track your growth with detailed analytics, revenue insights, and audience engagement metrics.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data and transactions are protected with bank-grade security and 99.9% uptime guarantee.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in minutes. Set up your creator profile and start receiving support immediately.",
  },
  {
    icon: Globe,
    title: "Made for Nepal",
    description: "Built specifically for Nepali creators with local language support and cultural understanding.",
  }
];

// Testimonials data
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Digital Artist",
    content: "MeroCircle transformed my art journey. Local payments made it so easy for my supporters!",
    avatar: "PS",
    rating: 5,
  },
  {
    name: "Raj Gurung",
    role: "Content Creator",
    content: "The community features are amazing. I can connect with my audience like never before.",
    avatar: "RG",
    rating: 5,
  },
  {
    name: "Maya Thapa",
    role: "Writer",
    content: "Finally, a platform that understands Nepali creators. The analytics help me grow better.",
    avatar: "MT",
    rating: 5,
  }
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (isHeroInView) {
      controls.start("visible");
    }
    
    // Check for URL messages
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setUrlMessage(message);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isHeroInView, controls]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        logger.debug('Redirecting to dashboard after timeout', 'LANDING_PAGE');
        router.push('/dashboard');
      }
    }, 3000);

    if (!loading && isAuthenticated) {
      clearTimeout(timeoutId);
      router.push('/dashboard');
    }

    return () => clearTimeout(timeoutId);
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      
      {/* URL Message Display */}
      {urlMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {urlMessage === 'auth_required' && 'Please complete authentication'}
                  {urlMessage !== 'auth_required' && urlMessage}
                </p>
                {urlMessage === 'auth_required' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Check browser console for detailed logs
                  </p>
                )}
              </div>
              <button
                onClick={() => setUrlMessage(null)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Hero Section - Overlay Layout (Desktop) / Stacked Layout (Mobile) */}
      <section className="relative bg-[#fafafa] pt-24 pb-12 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
          {/* Mobile Layout: Stacked (Text First, Then Illustration) */}
          <div className="flex flex-col lg:hidden mb-8">
            {/* Text Section - Top on Mobile */}
            <div className="mb-8">
              {/* Large Heading Text */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6"
              >
                <h1 className="text-[32px] sm:text-[42px] font-black leading-[1.1] tracking-[-2px]" style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  <span className="bg-gradient-to-r from-[#ff4000] to-[#ff6b35] bg-clip-text text-transparent">Your Favorite</span>{" "}
                  <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">Creator</span>
                  <br />
                  <span className="text-black/70">now more</span>{" "}
                  <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">closer</span>
                  <br />
                  <span className="text-black/70">than</span>{" "}
                  <span className="bg-gradient-to-r from-[#ff4000] to-[#ff6b35] bg-clip-text text-transparent">ever</span>
                </h1>
              </motion.div>

              {/* Small Description Text */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h2 className="text-[19px] font-semibold leading-[1.5] tracking-[-0.3px] text-black mb-4">
                  The creator who inspires you, 
                  <br />
                  <span className="text-[#ff4000]">deserves your support.</span>
                </h2>
                <p className="text-[16px] leading-[1.6] text-black/70">
                  Every like, share, and moment of connection matters. Now you can directly support the creators who bring joy, knowledge, and inspiration to your life. <span className="text-black font-medium">Join their community. Be part of their journey.</span>
                </p>
              </motion.div>
            </div>

            {/* Illustration - Below Text on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.6 },
                y: { duration: 0.8, delay: 0.6 }
              }}
              className="relative w-full h-[400px] sm:h-[500px]"
            >
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="relative w-full h-full"
              >
                <Image
                  src="/illustration (1).png"
                  alt="Creator Illustration"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Desktop Layout: Overlay (Hidden on Mobile) */}
          <div className="hidden lg:block relative h-[650px] mb-8">
            {/* Large Illustration Covering Full Hero - Moving */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -20, 0],
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.2 },
                scale: { duration: 0.8, delay: 0.2 },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }
              }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full max-w-[800px]">
                <Image
                  src="/illustration (1).png"
                  alt="Creator Illustration"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
            </motion.div>

            {/* Left Side: Large Heading Text */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-4 lg:pl-12 max-w-[45%]"
            >
              <h1 className="text-[40px] lg:text-[56px] xl:text-[64px] font-black leading-[1.1] tracking-[-2px]" style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, sans-serif' }}>
                <span className="bg-gradient-to-r from-[#ff4000] to-[#ff6b35] bg-clip-text text-transparent">Your</span>{" "}
                <span className="bg-gradient-to-r from-[#ff4000] to-[#ff6b35] bg-clip-text text-transparent">Favorite</span>
                <br />
                <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">Creator</span>{" "}
                <span className="text-black/70">now</span>
                <br />
                <span className="text-black/70">more</span>{" "}
                <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">closer</span>
                <br />
                <span className="text-black/70">than</span>{" "}
                <span className="bg-gradient-to-r from-[#ff4000] to-[#ff6b35] bg-clip-text text-transparent">ever</span>
              </h1>
            </motion.div>

            {/* Right Side: Small Description Text */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute right-0 top-0 bottom-0 flex flex-col justify-center z-10 pr-4 lg:pr-12 max-w-[380px]"
            >
              <h2 className="text-[20px] lg:text-[24px] font-semibold leading-[1.5] tracking-[-0.3px] text-black mb-6">
                The creator who inspires you, 
                <br />
                <span className="text-[#ff4000]">deserves your support.</span>
              </h2>
              <p className="text-[17px] lg:text-[18px] leading-[1.6] text-black/70">
                Every like, share, and moment of connection matters. Now you can directly support the creators who bring joy, knowledge, and inspiration to your life. <span className="text-black font-medium">Join their community. Be part of their journey.</span>
              </p>
            </motion.div>
          </div>

          {/* iPad/Tablet Video Section - Below Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative"
          >
            {/* CTA Button Above Tablet */}
            <div className="flex justify-center mb-[-25px] relative z-10">
              <Link href="/auth">
                <Button className="bg-black hover:bg-black/90 text-white px-6 py-3 rounded-full font-medium text-[17px] shadow-2xl">
                  Start Supporting Creators
                </Button>
              </Link>
            </div>

            {/* Tablet Container */}
            <div className="backdrop-blur-[2.5px] bg-[rgba(204,204,204,0.2)] p-[26px] rounded-[60px]">
              <div className="relative rounded-[29px] overflow-hidden shadow-[0px_0px_0px_6px_black,0px_50px_48px_0px_rgba(0,0,0,0.59)]">
                {/* iPad Frame */}
                <div className="aspect-[1084/783] bg-gradient-to-br from-gray-100 to-gray-200 relative rounded-[37px] overflow-hidden">
                  {/* Screen Content Area */}
                  <div className="absolute left-[47px] right-[47px] top-[44px] bottom-[44px] bg-white rounded-lg overflow-hidden">
                    {/* Video Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                          <Play className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-gray-600 font-medium">See MeroCircle in Action</p>
                        <p className="text-sm text-gray-500 mt-2">Video placeholder - Add your demo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section - Rounded White theme */}
      <RoundedSection theme="white" id="solutions">
        <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 items-start">
            <div className="w-full lg:w-5/12 flex-shrink-0">
              <Badge className="mb-5 sm:mb-7 bg-black text-white text-xs" variant="default">Why MeroCircle</Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-7 tracking-tight leading-[0.92] text-black">
                Support your <span className="text-[#ff4000]">favorite creator</span> directly.
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-black/60/60 max-w-md">
                No middlemen. No complicated processes. Just you, your favorite creator, and a community built on genuine connection and support.
              </p>
            </div>
            <div className="w-full lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
              {[
                { icon: Heart, title: "Direct Support", description: "Send support directly to creators you love with local payment methods." },
                { icon: Users, title: "Build Community", description: "Join exclusive communities and connect with creators and fellow supporters." },
                { icon: MessageCircle, title: "Stay Connected", description: "Get updates, exclusive content, and meaningful interactions with creators." },
                { icon: TrendingUp, title: "Grow Together", description: "Watch your favorite creators thrive with your support and encouragement." }
              ].map((card, index) => (
                <Card key={index} className="bg-gray-50/50/50 border-none shadow-none rounded-2xl sm:rounded-3xl p-2 sm:p-3 group active:bg-[#ff4000] hover:bg-[#ff4000] hover:text-white transition-colors duration-500 min-w-0 touch-manipulation">
                  <CardHeader className="p-6 sm:p-7">
                    <card.icon className="h-9 w-9 sm:h-11 sm:w-11 mb-3 sm:mb-4 text-[#ff4000] group-hover:text-white group-active:text-white transition-colors flex-shrink-0" />
                    <CardTitle className="text-base sm:text-lg font-bold leading-tight mb-2">{card.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm group-hover:text-white/80 group-active:text-white/80 leading-relaxed">{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </RoundedSection>

      {/* Solution Section - White theme */}
      <RoundedSection theme="white">
        <AnimatedSection className="w-full max-w-5xl mx-auto text-center" delay={0.1}>
          <Badge className="mb-4 sm:mb-6 bg-black text-white text-xs" variant="default">How It Works</Badge>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-[0.9] px-2 text-black">
            Creators. Supporters. <br />
            <span className="text-[#ff4000]">Nothing in between.</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-black/60 mb-12 sm:mb-14 lg:mb-16 max-w-2xl mx-auto px-4">
            MeroCircle gives you a direct line of access to your favorite creators, with no ads or gatekeepers in the way. Through real-time connections, comments, and direct support, you can connect more deeply with creators here than anywhere else.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 lg:gap-8">
            {[
              { icon: Heart, title: "Support" },
              { icon: Users, title: "Connect" },
              { icon: Globe, title: "Discover" },
              { icon: Shield, title: "Secure" },
            ].map((item, index) => (
              <motion.div key={index} className="flex flex-col items-center justify-center group min-w-0 touch-manipulation" whileHover={{ y: -10 }} whileTap={{ scale: 0.95 }}>
                <div className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-[#ff4000] group-active:bg-[#ff4000] transition-colors duration-500 flex-shrink-0">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-black group-hover:text-white group-active:text-white transition-colors flex-shrink-0" />
                </div>
                <h3 className="text-xs sm:text-sm lg:text-base font-bold tracking-tight text-black">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </RoundedSection>

      {/* Ways to Support Section - Inspired by Buy Me a Coffee */}
      <RoundedSection theme="white" id="ways-to-support">
        <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-black text-white text-xs" variant="default">Ways to Support</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-[0.95] text-black">
              Fund your <span className="text-[#ff4000]">favorite creator</span>
              <br />
              in ways that matter.
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-black/60 max-w-2xl mx-auto">
              Support creators. Join memberships. Buy their products. It&apos;s easier than you think.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Memberships */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#ff4000] transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-black">Memberships</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed mb-4">
                Start a membership for your biggest fans. Earn recurring income by accepting monthly or yearly subscriptions. Share exclusive content and build a loyal community.
              </p>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <CheckCircle className="w-4 h-4 text-[#ff4000]" />
                <span>Recurring income</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60 mt-2">
                <CheckCircle className="w-4 h-4 text-[#ff4000]" />
                <span>Exclusive content</span>
              </div>
            </motion.div>

            {/* Shop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#ff4000] transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-black">Buy from Creators</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed mb-4">
                Purchase digital products directly from your favorite creators. Whether it&apos;s an ebook, art commission, exclusive content, or digital artwork, buy what creators have created just for you.
              </p>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <CheckCircle className="w-4 h-4 text-[#ff4000]" />
                <span>One-tap checkout</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60 mt-2">
                <CheckCircle className="w-4 h-4 text-[#ff4000]" />
                <span>Direct from creators</span>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      </RoundedSection>

      {/* Trust & Ownership Section - Inspired by Buy Me a Coffee */}
      <RoundedSection theme="grey">
        <AnimatedSection className="w-full max-w-5xl mx-auto" delay={0.1}>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 text-xs" variant="outline">Built for Creators</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-[0.95]">
              Designed for creators,
              <br />
              <span className="text-[#ff4000]">not for businesses.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <Shield className="w-8 h-8 text-[#ff4000] mb-4" />
              <h3 className="text-xl font-bold mb-3 text-black">100% Ownership</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                You have complete ownership of your supporters. We never email them, and you can export your supporter list anytime you like.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <Zap className="w-8 h-8 text-[#ff4000] mb-4" />
              <h3 className="text-xl font-bold mb-3 text-black">Instant Payments</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                Get paid instantly to your bank account. No more 30-day delays. With eSewa and Khalti, your money reaches you faster.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <Globe className="w-8 h-8 text-[#ff4000] mb-4" />
              <h3 className="text-xl font-bold mb-3 text-black">Made for Nepal</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                Built specifically for Nepali creators with local payment methods, language support, and understanding of the local creator economy.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <MessageCircle className="w-8 h-8 text-[#ff4000] mb-4" />
              <h3 className="text-xl font-bold mb-3 text-black">Human Support</h3>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                You get to talk to a real human for help, or if you just like some advice to hit the ground running. We&apos;re here for you.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </RoundedSection>

      {/* Process Section - Grey theme */}
      <RoundedSection theme="grey" id="process">
        <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
            <div className="w-full lg:w-1/3 flex-shrink-0">
              <Badge className="mb-4 sm:mb-6 text-xs" variant="outline">Get Started</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight leading-[0.95]">
                Join the <br /> community <br /> today.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Start supporting your favorite creators or build your own community. It&apos;s simple, secure, and built for Nepal.
              </p>
            </div>
            <div className="w-full lg:w-2/3 space-y-4 sm:space-y-5 min-w-0">
              {[
                { step: "01", title: "Find Creators", desc: "Discover amazing creators from Nepal across different categories and interests." },
                { step: "02", title: "Join Communities", desc: "Become part of exclusive communities and connect with like-minded supporters." },
                { step: "03", title: "Show Support", desc: "Support creators directly using eSewa or Khalti - Nepal&apos;s trusted payment methods." },
                { step: "04", title: "Stay Connected", desc: "Get updates, exclusive content, and meaningful interactions with your favorite creators." },
                { step: "05", title: "Grow Together", desc: "Watch creators thrive and communities flourish with your support and engagement." }
              ].map((item, index) => (
                <div key={index} className="flex items-start sm:items-center gap-3 sm:gap-6 lg:gap-8 p-6 sm:p-7 lg:p-9 bg-white border border-gray-200 rounded-2xl sm:rounded-[2rem] group hover:border-[#ff4000] active:border-[#ff4000] transition-colors duration-500 min-w-0 touch-manipulation">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-300 group-hover:text-[#ff4000] group-active:text-[#ff4000] transition-colors flex-shrink-0">{item.step}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight mb-1 text-black">{item.title}</h3>
                    <p className="text-xs sm:text-sm lg:text-base text-black/70 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 flex-shrink-0 hidden sm:block h-5 w-5 lg:h-6 lg:w-6 text-black" />
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </RoundedSection>

      {/* CTA Section - Clean */}
      <section className="py-32 bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2 variants={fadeInUp} className="text-[48px] md:text-[64px] font-bold text-black leading-tight tracking-tight">
              Ready to support your favorite creator?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[16px] text-black/60/60">
              Join thousands of supporters making a difference in Nepal&apos;s creator community.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-black hover:bg-black/90 text-white font-medium text-[17px] rounded-full shadow-2xl"
                >
                  Start Supporting Creators
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t-2 border-black/10/10">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[32px] font-bold text-black">MeroCircle</h3>
              </div>
              <p className="text-[16px] text-black/60/60 mb-4 leading-relaxed max-w-md">
                On Demand Creator Platform,
                <br />
                Delivered Overnight.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-black text-[14px] uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/auth" className="text-black/60 hover:text-black transition-colors">About us</Link></li>
                <li><Link href="/dashboard" className="text-black/60 hover:text-black transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="text-black/60 hover:text-black transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-black text-[14px] uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/help" className="text-black/60 hover:text-black transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-black/60 hover:text-black transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="text-black/60 hover:text-black transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t-2 border-black/10/10 pt-8">
            <p className="text-[14px] text-black/50/50">
              © 2024 MeroCircle. Made with ❤️ for Nepal&apos;s creative community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
